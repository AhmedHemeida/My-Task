function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function readSort(value, allowed, fallback) {
  if (!value) return fallback;
  const field = value.startsWith('-') ? value.slice(1) : value;
  return allowed.includes(field) ? value : fallback;
}

function searchFilter(search, fields) {
  if (!search || !search.trim()) return null;
  const regex = new RegExp(escapeRegex(search.trim()), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

function paginated(items, total, page, limit) {
  return { items, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) };
}

module.exports = { readPagination, readSort, searchFilter, paginated };
