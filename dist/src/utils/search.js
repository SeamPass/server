"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySearch = void 0;
function applySearch(baseQuery, searchTerm, searchFields) {
    if (!searchTerm || searchFields.length === 0) {
        return baseQuery;
    }
    const searchConditions = {
        $or: searchFields.map((field) => ({
            [field]: { $regex: new RegExp(searchTerm, "i") },
        })),
    };
    return Object.assign(Object.assign({}, baseQuery), searchConditions);
}
exports.applySearch = applySearch;
