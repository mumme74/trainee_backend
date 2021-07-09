const Joi = require('joi');

module.exports = {
    validateBody: (schema) => {
        return (req, res, next) => {
            const result = schema.validate(req.body);
            if (result.error) {
                return res.status(400).json(result.error);
            }

            if (!req.value) req.value = {};

            // req.value.body instead fo req.body
            req.value['body'] = result.value;
            next();
        }
    },

    schemas: {
        loginSchema: Joi.object().keys({
            login: [
                Joi.string().email().required(),
                Joi.string().alphanum().min(3).max(30).required(),
            ],
            password: Joi.string().required()
        }),
        newUserSchema: Joi.object().keys({
            firstName: Joi.string().alphanum().min(2).max(30).required(),
            lastName: Joi.string().alphanum().min(2).max(50).required(),
            userName: Joi.string().alphanum().pattern(/[^@]{3,}/).max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/).required() 
        })
    }
};