const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe('groups e2e', () => {

    before(() => dropCollection('users'));
    before(() => dropCollection('profiles'));
    before(() => dropCollection('groups'));
    
    let user1 = {
        email: 'foo@bar.com',
        password: 'foobar',
        name: 'Mr. Foo Bar'
    };

    let user2 = {
        email: 'another@user.com',
        password: 'notfoobar',
        name: 'Mr. Not ME'
    };

    let profile1 = {
        userId: {},
        activities: 'basketball',
        bio: 'this is me',
        demographic: 'Im a boop',
        location: 'Portland',
        image: 'image link'
    };

    let profile2 = {
        userId: {},
        activities: 'basketball',
        bio: 'this is me',
        demographic: 'Im a boop',
        location: 'Portland',
        image: 'image link'
    };

    let group1 = {
        captains: [],
        members: [],
        teamName: 'Sneaky Sneks',
        type: 'soccer',
        description: 'We are the sneaky sneks',
        private: false,
        image: 'Image'
    };

    let group2 = {
        captains: [],
        members: [],
        teamName: 'Not sneaky',
        type: 'soccer',
        description: 'We are the sneaky sneks',
        private: false,
        image: 'Image'
    };

    before(() => {
        return request
            .post('/api/auth/signup')
            .send(user1)
            .then(({ body }) => {
                user1 = body;
                user1.token = body.token;
            });
    }); 
    
    before(() => {
        return request
            .post('/api/auth/signup')
            .send(user2)
            .then(({ body }) => {
                user2 = body;
                user2.token = body.token;
            });
    }); 

    before(() => {
        profile1.userId = user1._id;
        return request.post('/api/profiles')
            .set('Authorization', user1.token)
            .send(profile1)
            .then(({ body }) => {
                profile1 = body;
            });
    });


    before(() => {
        profile2.userId = user1._id;
        return request.post('/api/profiles')
            .set('Authorization', user1.token)
            .send(profile2)
            .then(({ body }) => {
                profile2 = body;
            });
    });

    it('creates a new group', () => {
        group1.captains.push(profile1._id);
        group1.members.push(profile1._id);

        return request.post('/api/groups')
            .set('Authorization', user1.token)
            .send(group1)
            .then(({ body }) => {
                const { _id, __v } = body;
                assert.isOk(_id);
                assert.equal(__v, 0);
                assert.deepEqual(body, { _id, __v, ...group1 });
                group1 = body;
            });
    });

    it('creates a second group', () => {
        group2.captains.push(profile1._id);
        group2.members.push(profile1._id);

        return request.post('/api/groups')
            .set('Authorization', user1.token)
            .send(group2)
            .then(({ body }) => {
                const { _id, __v } = body;
                assert.isOk(_id);
                assert.equal(__v, 0);
                assert.deepEqual(body, { _id, __v, ...group2 });
                group2 = body;
            });
    });

    
    it('gets all', () => {
        return request.get('/api/groups')
            .set('Authorization', user1.token)
            .then(({ body }) => {
                assert.deepEqual(body[0].captains[0].userId.name, 'Mr. Foo Bar');
                assert.deepEqual(body[0].members[0].userId.name, 'Mr. Foo Bar');
            });
    });
    
    it('gets group by id', () => {
        return request.get(`/api/groups/${group1._id}`)
            .set('Authorization', user1.token)
            .then(({ body }) => {
                assert.deepEqual(body.captains[0].userId.name, 'Mr. Foo Bar');
            });
    });

    it('cannon update a group they are not a captain of', () => {
        group1.members.push(profile2._id);
        return request.put(`/api/groups/${group1._id}`)
            .set('Authorization', user2.token)
            .send(group1)
            .then(res => {
                assert.equal(res.status, 403);
                assert.equal(res.body.error, 'user is not a captain');
                return request.get(`/api/groups/${group1._id}`)
                    .set('Authorization', user1.token);
            })
            .then(({ body }) => {
                assert.equal(body.members.length, 1);
            });
    });

    it('updates a group by id', () => {
        return request.put(`/api/groups/${group1._id}`)
            .set('Authorization', user1.token)
            .send(group1)
            .then(({ body }) => {
                assert.deepEqual(body, group1);
                return request.get(`/api/groups/${group1._id}`)
                    .set('Authorization', user1.token);
            })
            .then(({ body }) => {
                assert.equal(body.members.length, 2);
            });
    });

    it('updates an group by id only members', () => {
        group1.members.push(profile2._id);
        return request.put(`/api/groups/${group1._id}/mem`)
            .set('Authorization', user1.token)
            .send(group1)
            .then(({ body }) => {
                assert.deepEqual(body, group1);
                return request.get(`/api/groups/${group1._id}`)
                    .set('Authorization', user1.token);
            })
            .then(({ body }) => {
                assert.equal(body.members.length, 3);
            });
    });

    it('cannot deletes an group if not a captain', () => {
        group1.members.push(profile2._id);

        return request.delete(`/api/groups/${group1._id}`)
            .set('Authorization', user2.token)
            .then(res => {
                assert.equal(res.status, 403);
                assert.equal(res.body.error, 'user is not a captain');

                return request.get(`/api/groups/${group1._id}`)
                    .set('Authorization', user2.token);
            })
            .then(res => {
                assert.equal(res.status, 200);
            });
    });

    it('deletes a group by id', () => {
        return request.delete(`/api/groups/${group1._id}`)
            .set('Authorization', user1.token)
            .then(() => {
                return request.get(`/api/groups/${group1._id}`)
                    .set('Authorization', user1.token);
            })
            .then(res => {
                assert.equal(res.status, 404);
            });
    });


});