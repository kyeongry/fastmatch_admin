const ReviewModel = require('../models/review.mongodb');

const getReviewsByBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        if (!branchId) {
            return res.status(400).json({ success: false, message: '지점 ID가 필요합니다' });
        }

        const reviews = await ReviewModel.findByBranchId(branchId);
        const total = await ReviewModel.countByBranchId(branchId);

        const formattedReviews = reviews.map(review => ({
            id: review._id.toString(),
            _id: review._id.toString(),
            branch_id: review.branch_id.toString(),
            author_id: review.author_id.toString(),
            author_name: review.author_name,
            author: {
                id: review.author_id.toString(),
                name: review.author_name,
            },
            content: review.content,
            rating: review.rating,
            created_at: review.created_at,
            updated_at: review.updated_at,
        }));

        res.json({ success: true, reviews: formattedReviews, total });
    } catch (error) {
        console.error('리뷰 조회 실패:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const createReview = async (req, res) => {
    try {
        const { branch_id, content, rating } = req.body;

        if (!branch_id || !content) {
            return res.status(400).json({ success: false, message: '지점 ID와 내용은 필수입니다' });
        }

        if (content.length > 500) {
            return res.status(400).json({ success: false, message: '리뷰 내용은 500자 이내여야 합니다' });
        }

        const review = await ReviewModel.create({
            branch_id,
            author_id: req.user.id,
            author_name: req.user.name || req.user.email,
            content: content.trim(),
            rating: Math.min(5, Math.max(1, rating || 5)),
        });

        res.status(201).json({
            success: true,
            review: {
                id: review._id.toString(),
                _id: review._id.toString(),
                branch_id: review.branch_id.toString(),
                author_id: review.author_id.toString(),
                author_name: review.author_name,
                content: review.content,
                rating: review.rating,
                created_at: review.created_at,
            },
            message: '리뷰가 등록되었습니다',
        });
    } catch (error) {
        console.error('리뷰 생성 실패:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, message: '내용은 필수입니다' });
        }

        const existing = await ReviewModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다' });
        }

        // 작성자 본인만 수정 가능
        if (existing.author_id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다' });
        }

        const updated = await ReviewModel.updateById(id, { content: content.trim() });
        res.json({ success: true, review: updated, message: '리뷰가 수정되었습니다' });
    } catch (error) {
        console.error('리뷰 수정 실패:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await ReviewModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: '리뷰를 찾을 수 없습니다' });
        }

        // 작성자 본인 또는 관리자만 삭제 가능
        if (existing.author_id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다' });
        }

        await ReviewModel.deleteById(id);
        res.json({ success: true, message: '리뷰가 삭제되었습니다' });
    } catch (error) {
        console.error('리뷰 삭제 실패:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getReviewsByBranch,
    createReview,
    updateReview,
    deleteReview,
};
