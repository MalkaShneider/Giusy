const Candidate = require('../models/candidate.model');

class CandidateRepository {
  async create(data) {
    return await Candidate.create(data);
  }

  async findById(id) {
    return await Candidate.findById(id).lean();
  }

  async getCandidateByIdWithAnaysis(id) {
    return await Candidate.findById(id).populate('analysis');
  }

  async getAllCandidatesWithSomeAnaysis() {
    return await Candidate.find()
      .populate('analysis', 'finalScore recommendedRole')
      .lean();
  }

  // Returns all candidates with populated `analysis` field (lean objects).
  async findAllWithAnalysis() {
    return await Candidate.find().populate('analysis').lean();
  }

  // Returns all candidates without the `analysis` field (for lighter responses).
  async findAll() {
    return await Candidate.find().lean();
  }

  async update(id, data) {
    return await Candidate.findByIdAndUpdate(id, data, { new: true });
  }

    async findAll() {
    return await Candidate.find();
    }
}

module.exports = new CandidateRepository();
