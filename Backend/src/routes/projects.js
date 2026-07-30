const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { auth, adminOnly } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

const router = express.Router();

router.use(auth);

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or more'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('sort').optional().trim(),
  validate,
  projectController.list
);

router.get('/:id', param('id').isMongoId().withMessage('Invalid project id'), validate, projectController.getOne);

router.post(
  '/',
  adminOnly,
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('members.*').isMongoId().withMessage('Invalid member id'),
  validate,
  projectController.create
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId().withMessage('Invalid project id'),
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional().trim(),
  validate,
  projectController.update
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId().withMessage('Invalid project id'),
  validate,
  projectController.remove
);

router.post(
  '/:id/members',
  adminOnly,
  param('id').isMongoId().withMessage('Invalid project id'),
  body('userId').isMongoId().withMessage('A valid user id is required'),
  validate,
  projectController.addMember
);

router.delete(
  '/:id/members/:userId',
  adminOnly,
  param('id').isMongoId().withMessage('Invalid project id'),
  param('userId').isMongoId().withMessage('Invalid user id'),
  validate,
  projectController.removeMember
);

module.exports = router;
