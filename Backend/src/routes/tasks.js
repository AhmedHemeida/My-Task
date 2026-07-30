const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const taskController = require('../controllers/taskController');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../constants');

const router = express.Router();

router.use(auth);

router.get(
  '/',
  query('project').optional().isMongoId().withMessage('Invalid project id'),
  query('assignee').optional().isMongoId().withMessage('Invalid assignee id'),
  query('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status'),
  query('priority').optional().isIn(TASK_PRIORITIES).withMessage('Invalid priority'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be 1 or more'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('sort').optional().trim(),
  validate,
  taskController.list
);

router.get('/:id', param('id').isMongoId().withMessage('Invalid task id'), validate, taskController.getOne);

router.post(
  '/',
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('project').isMongoId().withMessage('A valid project id is required'),
  body('description').optional().trim(),
  body('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid due date'),
  body('assignee').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid assignee id'),
  validate,
  taskController.create
);

router.put(
  '/:id',
  param('id').isMongoId().withMessage('Invalid task id'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid due date'),
  body('assignee').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid assignee id'),
  validate,
  taskController.update
);

router.delete('/:id', param('id').isMongoId().withMessage('Invalid task id'), validate, taskController.remove);

module.exports = router;
