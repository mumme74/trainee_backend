const chai = require("chai");
const faker = require("faker");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const rewire = require("rewire");
const { expect } = chai;

const User = require("../../../server/models/user");
const userController = rewire("../../../server/controllers/users.js");

chai.use(sinonChai);

let sandbox = null;

describe("Users Controller", () => {
  let req = {
    user: { id: faker.datatype.number() },
    value: {
      body: {
        email: faker.internet.email(),
        password: faker.internet.password(),
      },
    },
  };
  let res = {
    json: function () {
      return this;
    },
    status: function () {
      return this;
    },
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("secret", () => {
    it("should return resource  when called", () => {
      sandbox.spy(console, "log");
      sandbox.spy(res, "json");

      return userController.secret(req, res).then(() => {
        expect(console.log).to.have.been.called;
        expect(
          res.json.calledWith({ secret: "Access granted to secret resource!" })
        ).to.be.ok;
        expect(res.json).to.have.been.calledWith({
          secret: "Access granted to secret resource!",
        });
      });
    });
  });

  describe("signin", () => {
    it("should return token when signin called", () => {
      sandbox.spy(res, "json");
      sandbox.spy(res, "status");

      // this test we are only going to test for status 200
      // next test we test for fake token
      return userController.signin(req, res).then(() => {
        expect(res.status).to.have.been.calledWith(200);
        expect(res.json.callCount).to.equal(1);
      });
    });

    it("should return fake token using rewire", () => {
      sandbox.spy(res, "json");
      sandbox.spy(res, "status");

      // fake jwt with rewire
      let signToken = userController.__set__(
        "signToken",
        (user) => "fakeToken"
      );

      // we expect res json to have been called with our fake token
      return userController.signin(req, res).then(() => {
        expect(res.json).to.have.been.calledWith({ token: "fakeToken" });
        signToken();
      });
    });
  });

  describe("signup", () => {
    it("should return 403 if the user is already saved in the db", () => {
      sandbox.spy(res, "json");
      sandbox.spy(res, "status");
      sandbox
        .stub(User, "findOne")
        .returns(Promise.resolve({ id: faker.datatype.number() }));

      return userController.signup(req, res).then(() => {
        expect(res.status).to.have.been.calledWith(403);
        expect(res.json).to.have.been.calledWith({
          error: "email already in use",
        });
      });
    });

    it("should return 200 if user is not in db and it was saved", () => {
      sandbox.spy(res, "json");
      sandbox.spy(res, "status");
      sandbox.stub(User, "findOne").returns(Promise.resolve(false));
      sandbox
        .stub(User.prototype, "save")
        .returns(Promise.resolve({ id: faker.datatype.number() }));

      // next test will fake token with our fake token to see that
      // json body has been called with it at the moment we only count
      // the callback count on json spy should be 2
      return userController.signup(req, res).then(() => {
        expect(res.status).to.have.been.calledWith(200);
        expect(res.json.callCount).to.equal(1);
      });
    });

    it("should return 200 if our user is not in db using callback done", (done) => {
      sandbox.spy(res, "json");
      sandbox.spy(res, "status");
      sandbox.stub(User, "findOne").returns(Promise.resolve(false));
      sandbox
        .stub(User.prototype, "save")
        .returns(Promise.resolve({ id: faker.datatype.number() }));

      // example with done callback, we will call it in the then function
      // as we know the userConteoller singup returns promise
      // and expect result spy to have been called as expected
      userController.signup(req, res).then(() => {
        expect(res.status).to.have.been.calledWith(200);
        expect(res.json.callCount).to.equal(1);
        done();
      });
    });

    it("should return fake token in res.json", () => {
      sandbox.spy(res, "json");
      sandbox.spy(res, "status");
      sandbox
        .stub(User, "findOne")
        .returns(Promise.resolve(Promise.resolve(false)));
      sandbox
        .stub(User.prototype, "save")
        .returns(
          Promise.resolve(Promise.resolve({ id: faker.datatype.number() }))
        );

      let signToken = userController.__set__(
        "signToken",
        (user) => "fakeTokenNumberTwo"
      );
      return userController.signup(req, res).then(() => {
        expect(res.json).to.have.been.calledWith({
          token: "fakeTokenNumberTwo",
        });
        signToken();
      });
    });
  });
});
