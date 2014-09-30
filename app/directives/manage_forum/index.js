var fs = require('fs');
var _ = require('lodash');

module.exports = ['$http', function($http) {
  return {
    restrict: 'E',
    template: fs.readFileSync(__dirname + '/../../templates/directives/manage-forum.html'),
    scope: {
      categories: '=',
      boards: '=',
    },
    link: function(scope) {
      scope.newCatName = '';
      scope.newBoardName = '';
      var nestIndex = 0;
      var newBoards = []; // stores newly added boards

      // Init for view (creates nestable lists for categorized/uncategorized boards)
      var originalCatHtml;
      var originalNoCatHtml;
      scope.$watchGroup(['categories', 'boards'], function(newValues) {
        var cats = newValues[0];
        var boards = newValues[1];
        if (cats && boards) {
          originalCatHtml = generateCategoryList(cats);
          originalNoCatHtml = generateNoCatBoardsList(boards);
          $('#cat-list').html(originalCatHtml);
          $('#no-cat-boards-list').html(originalNoCatHtml);
          $('#nestable-cats').nestable({ protectRoot: true, maxDepth: 5, group: 1 });
          $('#nestable-boards').nestable({ protectRoot: true, maxDepth: 4, group: 1 });
        }
      }, true);

      // Generates nestable html for categories
      var generateCategoryList = function(categories) {
        var html = '<div class="dd" id="nestable-cats"><ol class="dd-list">';
        categories.forEach(function(cat) {
          var catData = JSON.stringify({
            name: cat.name,
            children_ids: cat.board_ids || []
          });
          var toolbarHtml = '<i ng-click="editCategory()" class="dd-nodrag dd-right-icon fa fa-pencil"></i>';
          html += '<li class="dd-item dd-root-item" data-id="' + nestIndex++ +
            '" data-top="true" data-cat=\'' + catData + '\'><div class="dd-handle' +
            ' dd-root-handle">' + cat.name + toolbarHtml +'</div>' + generateBoardList(cat.boards) + '</li>';
        });
        html += '</ol></div>';
        return html;
      };

      // Generates nestable html for boards
      var generateBoardList = function(boards) {
        if (!boards) { return ''; }
        var html = '<ol class="dd-list">';
        boards.forEach(function(board) {
          // Store boardData within each li's data-board attr for easy access
          var boardData = JSON.stringify({
            id: board.id,
            name: board.name,
            children_ids: board.children_ids || []
          });
          var toolbarHtml = '<i ng-click="editBoard()" class="dd-nodrag dd-right-icon fa fa-pencil"></i>';
          html += '<li class="dd-item" data-id="' + nestIndex++ + '" data-board=\'' + boardData + '\'><div class="dd-handle">' + board.name + toolbarHtml + '</div>' + generateBoardList(board.children) + '</li>';
        });
        html += '</ol>';
        return html;
      };

      // Generates nestable html for uncategorized boards
      var generateNoCatBoardsList = function(boards) {
        var noCatBoards = [];
        boards.forEach(function(board) {
          if (!board.category_id && board.category_id !== 0) {
            noCatBoards.push(board);
          }
        });
        var emptyHtml = '<div class="dd-empty"></div>';
        var html = '<div class="dd" id="nestable-boards">';
        html += noCatBoards.length > 0 ? generateBoardList(noCatBoards) : emptyHtml;
        html += '</div>';
        return html;
      };

      // Translates serialized array into boards.updateCategory format
      var buildUpdatedCats = function(catsArr) {
        var updatedCats = [];
        catsArr.forEach(function(item) {
          var cat = {
            name: item.cat.name,
            board_ids: []
          };
          if (item.children) {
            item.children.forEach(function(child) {
              cat.board_ids.push(child.board.id);
            });
          }
          updatedCats.push(cat);
        });
        return updatedCats;
      };

      // Recursively builds a hashmap of moved boards
      var buildMovedBoardsHash = function(boardsArr, movedBoards) {
        if (!boardsArr) { return; }
        movedBoards = movedBoards || {};
        boardsArr.forEach(function(item) {
          var newChildrenIds = [];
          var board = item.board || item.cat;
          item.children = item.children || [];
          item.children.forEach(function(childItem) {
            var childBoard = childItem.board;
            newChildrenIds.push(childBoard.id);
          });
          // If arrays are not equal, a change has occured
          if(!_.isEqual(board.children_ids, newChildrenIds)) {
            var removedChildren = _.difference(board.children_ids, newChildrenIds);
            var addedChildren = _.difference(newChildrenIds, board.children_ids);
            removedChildren.forEach(function(removedChild) {
              movedBoards[removedChild] = movedBoards[removedChild] || {};
              movedBoards[removedChild].oldParent = board.id || '';
              if (movedBoards[removedChild].oldParent === '' && movedBoards[removedChild].newParent === '') {
                delete movedBoards[removedChild];
              }
            });
            addedChildren.forEach(function(addedChild) {
              movedBoards[addedChild] = movedBoards[addedChild] || {};
              movedBoards[addedChild].newParent = board.id || '';
              if (movedBoards[addedChild].oldParent === '' && movedBoards[addedChild].newParent === '') {
                delete movedBoards[addedChild];
              }
            });
            // Odering change for non top level boards (Update Board children_ids order)
            if (!removedChildren.length && !addedChildren.length && board.id) {
              console.log('New Board Order' + JSON.stringify(newChildrenIds));
            }
            // TODO: Account for boards moved from categorized -> uncategoriezed and vice versa

            // console.log('Cat/Board Name: ' + board.name);
            // console.log('Board ID: ' + board.id);
            // console.log('removed children:');
            // console.log(removedChildren);
            // console.log('added children:');
            // console.log(addedChildren);
            // console.log('all current children:');
            // console.log(newChildrenIds);
          }
          buildMovedBoardsHash(item.children, movedBoards);
        });
        return movedBoards;
      };

      var processMoveBoards = function(movedBoards) {
        console.log(JSON.stringify(movedBoards, null, 2));
      };

      scope.submit = function() {

        // 1) Create Boards which have been added
        console.log('1) Adding new Boards: \n' + JSON.stringify(newBoards, null, 2));
        var i = 0;
        newBoards.forEach(function(newBoard) {
           var newBoardEl = $('li[data-id="' + newBoard.dataId + '"]');
           var newBoardData = newBoardEl.data().board;
           newBoardData.id = 'FAKE ID' + i++;
           newBoardEl.data().board = newBoardData;
        });

        // 2) Handle Boards which have been moved/reordered
        console.log('2) Handling moved boards');
        var serializedArr = $('#nestable-cats').nestable('serialize');
        var movedBoards = buildMovedBoardsHash(serializedArr);
        processMoveBoards(movedBoards);
        // TODO: moveBoards(movedBoards);

        // 3) Updated all Categories
        var updatedCats = buildUpdatedCats(serializedArr);
        console.log('3) Updating Categories: \n' + JSON.stringify(updatedCats, null, 2));
        $http({
          url: '/api/boards/categories',
          method: 'POST',
          data: {
            categories: updatedCats
          }
        })
        .success(function(updated) {
          console.log('Success!');
          console.log(updated);
        });
              // core.boards.updateCategories(updatedCats);
      };

      // Resets to original state
      scope.reset = function() {
        $('#cat-list').html(originalCatHtml);
        $('#no-cat-boards-list').html(originalNoCatHtml);
        $('#nestable-cats').nestable({ protectRoot: true, maxDepth: 5, group: 1 });
        $('#nestable-boards').nestable({ protectRoot: true, maxDepth: 4, group: 1 });
      };

      // Expands all Categories/Boards
      scope.expandAll = function() {
        $('#nestable-cats').nestable('expandAll');
      };

      // Collapses all Categories/Boards
      scope.collapseAll = function() {
        $('#nestable-cats').nestable('collapseAll');
      };

      // Creates a new category
      scope.insertNewCategory = function() {
        if (scope.newCatName !== '') {
          var catData = JSON.stringify({
            name: scope.newCatName,
            children_ids: []
          });
          var toolbarHtml = '<i ng-click="editCategory()" class="dd-nodrag dd-right-icon fa fa-pencil"></i>';
          var newCatHtml = '<li class="dd-item dd-root-item" data-id="' + nestIndex++ +
            '" data-top="true" data-cat=\'' + catData + '\'>' +
            '<div class="dd-handle dd-root-handle">' +  scope.newCatName + toolbarHtml + '</div></li>';
          $('#nestable-cats > .dd-list').prepend(newCatHtml);
          $('#nestable-cats').nestable({ protectRoot: true, maxDepth: 5, group: 1 });
          scope.newCatName = '';
        }
      };

      // Creates a new board
      scope.insertNewBoard = function() {
        if (scope.newBoardName !== '') {
          // Add list if list is currently empty
          if ($('#nestable-boards').children('.dd-empty').length) {
            $('#nestable-boards').html('<ol class="dd-list"></ol>');
          }
          var newBoard = {
            id: '',
            dataId: nestIndex,
            name: scope.newBoardName,
            children_ids: []
          };
          newBoards.push(newBoard);
          var newBoardData = JSON.stringify(newBoard);
          var toolbarHtml = '<i ng-click="editCategory()" class="dd-nodrag dd-right-icon fa fa-pencil"></i>';
          var newBoardHtml = '<li class="dd-item" data-id="' + nestIndex++ +
            '" data-board=\'' + newBoardData + '\'><div class="dd-handle">' +  scope.newBoardName + toolbarHtml + '</div></li>';
          $('#nestable-boards > .dd-list').prepend(newBoardHtml);
          $('#nestable-boards').nestable({ protectRoot: true, maxDepth: 4, group: 1 });
          scope.newBoardName = '';
        }
      };
    }
  };
}];