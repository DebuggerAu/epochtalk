var Joi = require('joi');
var path = require('path');
var Boom = require('boom');
var db = require(path.normalize(__dirname + '/../../../../db'));

/**
  * @apiVersion 0.3.0
  * @apiGroup Moderators
  * @api {POST} /admin/moderators Add Moderator
  * @apiName AddModerator
  * @apiPermission Super Administrator, Administrator,
  * @apiDescription Add a moderator to a board.
  *
  * @apiParam (Payload) {string} user_id The id of the user to add as a moderator.
  * @apiParam (Payload) {string} board_id The id of the board to add the moderator to.
  *
  * @apiSuccess {} STATUS 200 OK
  *
  * @apiError (Error 500) InternalServerError There was an issue adding the moderator.
  */
exports.add = {
  auth: { strategy: 'jwt' },
  plugins: { acls: 'adminModerators.add' },
  validate: {
    payload: {
      user_id: Joi.string().required(),
      board_id: Joi.string().required()
    }
  },
  handler: function(request, reply) {
    var userId = request.payload.user_id;
    var boardId = request.payload.board_id;
    var promise = db.moderators.add(userId, boardId);
    return reply(promise);
  }
};

/**
  * @apiVersion 0.3.0
  * @apiGroup Moderators
  * @api {DELETE} /admin/moderators Remove Moderator
  * @apiName RemoveModerator
  * @apiPermission Super Administrator, Administrator,
  * @apiDescription Remove a moderator from a board.
  *
  * @apiParam (Payload) {string} user_id The id of the user to remove from being a moderator.
  * @apiParam (Payload) {string} board_id The id of the board to remove the moderator from.
  *
  * @apiSuccess {} STATUS 200 OK
  *
  * @apiError (Error 500) InternalServerError There was an issue removing the moderator.
  */
exports.remove = {
  auth: { strategy: 'jwt' },
  plugins: { acls: 'adminModerators.remove' },
  validate: {
    payload: {
      user_id: Joi.string().required(),
      board_id: Joi.string().required(),
    }
  },
  handler: function(request, reply) {
    var userId = request.payload.user_id;
    var boardId = request.payload.board_id;
    var promise = db.moderators.remove(userId, boardId);
    return reply(promise);
  }
};