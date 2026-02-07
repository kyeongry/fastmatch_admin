import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { reviewAPI } from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

/**
 * ReviewBoard - 지점 리뷰 게시판 컴포넌트
 *
 * @param {string} branchId - 지점 ID
 * @param {boolean} compact - 좌측 패널용 컴팩트 모드
 */
const ReviewBoard = ({ branchId, compact = false }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newReview, setNewReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const REVIEW_MAX_LENGTH = 500;

  useEffect(() => {
    if (branchId) {
      fetchReviews();
    }
  }, [branchId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await reviewAPI.getByBranch(branchId);
      setReviews(response.data?.reviews || []);
    } catch (err) {
      console.error('리뷰 조회 실패:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newReview.trim()) return;

    setSubmitting(true);
    try {
      await reviewAPI.create({
        branch_id: branchId,
        content: newReview.trim(),
      });
      success('리뷰가 등록되었습니다');
      setNewReview('');
      fetchReviews();
    } catch (err) {
      console.error('리뷰 등록 실패:', err);
      showError(err.response?.data?.message || '리뷰 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;
    try {
      await reviewAPI.delete(reviewId);
      success('리뷰가 삭제되었습니다');
      fetchReviews();
    } catch (err) {
      console.error('리뷰 삭제 실패:', err);
      showError('리뷰 삭제에 실패했습니다');
    }
  };

  const handleEdit = (review) => {
    setEditingId(review._id || review.id);
    setEditContent(review.content);
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editContent.trim()) return;
    try {
      await reviewAPI.update(reviewId, { content: editContent.trim() });
      success('리뷰가 수정되었습니다');
      setEditingId(null);
      setEditContent('');
      fetchReviews();
    } catch (err) {
      console.error('리뷰 수정 실패:', err);
      showError('리뷰 수정에 실패했습니다');
    }
  };

  return (
    <div>
      {!compact && <h3 className="text-lg font-bold text-gray-900 mb-4">지점 리뷰</h3>}

      {/* 리뷰 작성 폼 */}
      <div className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-2 mb-2' : 'p-4 mb-4'}`}>
        <div className="relative">
          <textarea
            value={newReview}
            onChange={(e) => {
              if (e.target.value.length <= REVIEW_MAX_LENGTH) {
                setNewReview(e.target.value);
              }
            }}
            maxLength={REVIEW_MAX_LENGTH}
            placeholder="리뷰를 작성해주세요..."
            className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${compact ? 'px-2 py-2 min-h-[50px] text-xs' : 'px-4 py-3 min-h-[80px] text-sm'}`}
            rows={compact ? 2 : 3}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">
              {newReview.length}/{REVIEW_MAX_LENGTH}자
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !newReview.trim()}
              className={`bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed ${compact ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'}`}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 리뷰 리스트 */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {loading ? (
          <div className={`text-center text-gray-400 ${compact ? 'py-4 text-xs' : 'py-8 text-sm'}`}>
            리뷰를 불러오는 중...
          </div>
        ) : reviews.length === 0 ? (
          <div className={`text-center text-gray-400 ${compact ? 'py-4 text-xs' : 'py-8 text-sm'}`}>
            아직 작성된 리뷰가 없습니다.
          </div>
        ) : (
          reviews.map((review) => {
            const reviewId = review.id || review._id;
            const isAuthor = user && (user.id === review.author_id || user.id === review.author?.id);
            const isAdmin = user && user.role === 'admin';
            const isEditing = editingId === reviewId;

            return (
              <div
                key={reviewId}
                className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-2' : 'p-4'}`}
              >
                <div className={`flex items-start justify-between ${compact ? 'mb-1' : 'mb-2'}`}>
                  <div className="flex items-center gap-2">
                    {!compact && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {(review.author?.name || review.author_name || '')[0] || '?'}
                      </div>
                    )}
                    <div>
                      <span className={`font-medium text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
                        {review.author?.name || review.author_name || '익명'}
                      </span>
                      {review.created_at && (
                        <div className="text-xs text-gray-400">
                          {compact ? new Date(review.created_at).toLocaleDateString('ko-KR') : formatDateTime(review.created_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 수정/삭제 버튼 */}
                  {(isAuthor || isAdmin) && !isEditing && (
                    <div className="flex gap-1">
                      {isAuthor && (
                        <button
                          onClick={() => handleEdit(review)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                        >
                          수정
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reviewId)}
                        className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {/* 리뷰 내용 */}
                {isEditing ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        if (e.target.value.length <= REVIEW_MAX_LENGTH) {
                          setEditContent(e.target.value);
                        }
                      }}
                      maxLength={REVIEW_MAX_LENGTH}
                      className={`w-full border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${compact ? 'px-2 py-1 text-xs min-h-[40px]' : 'px-3 py-2 text-sm min-h-[60px]'}`}
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setEditingId(null); setEditContent(''); }}
                        className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveEdit(reviewId)}
                        className="px-3 py-1 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-gray-700 whitespace-pre-wrap ${compact ? 'text-xs pl-0' : 'text-sm pl-10'}`}>
                    {review.content}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewBoard;
