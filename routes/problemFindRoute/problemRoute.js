const express = require("express");
const { handleCreateProblem, handleGetProblemById, handleGetProblems } = require("../../controller/problemController/problemController");
const supabaseUpload = require("../../config/uploadConfig/supabaseUpload");

const router = express.Router();

router.post('/problem/submit',supabaseUpload.single('imageUrl'),handleCreateProblem);
router.get('/problem',handleGetProblems);
router.delete('/problem/:problemId',handleGetProblemById);

module.exports = router;