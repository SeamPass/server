"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = void 0;
function paginate(model_1, baseQuery_1, searchTerm_1, searchFields_1, _a) {
    return __awaiter(this, arguments, void 0, function* (model, baseQuery, searchTerm, searchFields, { page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        let query = baseQuery;
        if (searchTerm) {
            query = Object.assign(Object.assign({}, query), { $or: searchFields.map((field) => ({
                    [field]: { $regex: new RegExp(searchTerm, "i") },
                })) });
        }
        const totalDocuments = yield model.countDocuments(query);
        const results = yield model.find(query).skip(skip).limit(limit).lean();
        return {
            results,
            pageInfo: {
                page,
                limit,
                totalDocuments,
                totalPages: Math.ceil(totalDocuments / limit),
                hasNextPage: page * limit < totalDocuments,
                hasPreviousPage: page > 1,
            },
        };
    });
}
exports.paginate = paginate;
