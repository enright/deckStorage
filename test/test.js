/* global describe: false */
/* global it: false */
/* global beforeEach: false */
/* global afterEach: false */
/* jshint unused: false */
/* jshint expr: true */

'use strict';

var should = require('should'),
	deckStorage = require('../lib/deckStorage'),
	request = require('supertest'),
	uuid = require('uuid');

describe('deck storage', function () {

	var app;

	beforeEach(function (done) {
		app = deckStorage.start(3002);
		done();
	});

	afterEach(function (done) {
		app.close();
		done();
	});
	
	describe('get', function (done) {
		it('gets an existing deck', function (done) {
			var uniqueData = uuid.v4();
			// create a deck
			request(app)
				.post('/deck')
				.send({ deck: { uniqueData: uniqueData }})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(201)
				.expect(function (res) {
					if (!res.body.id) {
						return 'no id returned';
					}
				})
				.end(function(err, res){
					var originalId;
					if (err) {
						return done(err);
					}
					originalId = res.body.id;
					// we should be able to get the deck
					request(app)
						.get('/deck/' + originalId)
						.set('Accept', 'application/json')
						.set('Content-type', 'application/json')
						.expect(200)
						.expect(function (res) {
							if (res.body.id !== originalId) {
								return 'id mismatch on get';
							} else if (!res.body.deck) {
								return 'no deck data';
							} else if (res.body.deck.uniqueData !== uniqueData) {
								return 'incorrect deck data';
							}
						})
						.end(function(err, res){
							done(err);
						});
				});
		});
	});
		
	describe('post', function (done) {
		it('returns a storage id which can be used to retrieve the deck', function (done) {
			var uniqueData = uuid.v4();
			request(app)
				.post('/deck')
				.send({ deck: { uniqueData: uniqueData }})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(201)
				.expect(function (res) {
					if (!res.body.id) {
						return 'no id returned';
					}
				})
				.end(function (err, res) {
					if (err) {
						return done(err);
					}
					request(app)
						.get('/deck/' + res.body.id)
						.set('Accept', 'application/json')
						.expect(200)
						.expect(function (res) {
							if (res.body.deck.uniqueData !== uniqueData) {
								return 'get request did not return correct deck';
							}
						})
						.end(function(err, res){
							done(err);
						});
				});
		});
	});
	
	describe('delete', function (done) {
		it('removes an existing deck', function (done) {
			var uniqueData = uuid.v4();
			// create a deck
			request(app)
				.post('/deck')
				.send({ deck: { uniqueData: uniqueData }})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(201)
				.expect(function (res) {
					if (!res.body.id) {
						return 'no id returned';
					}
				})
				.end(function (err, res) {
					var originalId;
					if (err) {
						return done(err);
					}
					originalId = res.body.id;
					// delete the deck
					request(app)
						.del('/deck/' + originalId)
						.set('Accept', 'application/json')
						.expect(200)
						.expect(function (res) {
							if (res.body.id !== originalId) {
								return 'delete request did not return correct deck id';
							}
						})
						.end(function(err, res){
							if (err) {
								return done(err);
							}
							// we should not be able to get the deck
							request(app)
								.get('/deck/' + originalId)
								.set('Accept', 'application/json')
								.expect(404)
								.end(function(err, res){
									done(err);
								});
						});
				});
		});
	});

	describe('put', function (done) {
		it('update a deck', function (done) {
			var uniqueData = uuid.v4();
			// create a deck with some unique data
			request(app)
				.post('/deck')
				.send({ deck: { uniqueData: uniqueData }})
				.set('Accept', 'application/json')
				.set('Content-type', 'application/json')
				.expect(201)
				.expect(function (res) {
					if (!res.body.id) {
						return 'no id returned';
					}
				})
				.end(function (err, res) {
					var newUniqueData,
						deckId;
					if (err) {
						return done(err);
					}
					newUniqueData = uuid.v4();
					deckId = res.body.id;
					// update the deck
					request(app)
						.put('/deck')
						.send({ id: deckId, deck: { uniqueData: newUniqueData }})
						.set('Accept', 'application/json')
						.set('Content-type', 'application/json')
						.expect(200)
						.expect(function (res) {
							if (res.body.id !== deckId) {
								return 'put request did not return correct deck id';
							}
						})
						.end(function(err, res){
							// get the deck and check that it has the new data
							request(app)
								.get('/deck/' + deckId)
								.set('Accept', 'application/json')
								.expect(200)
								.expect(function (res) {
									if (res.body.id !== deckId) {
										return 'wrong id returned on get';
									} else if (!res.body.deck) {
										return 'no deck returned on get';
									} else if (res.body.deck.uniqueData !== newUniqueData) {
										return 'deck data was not updated';
									}
								})
								.end(function(err, res){
									done(err);
								});
						});
				});
		});
	});

});