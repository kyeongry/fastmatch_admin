import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // 페이지네이션 & 캐시
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cacheRef = useRef({}); // branchId별 캐시
  const PAGE_SIZE = 20;

  const REVIEW_MAX_LENGTH = 500;

  useEffect(() => {
    if (branchId) {
      // 캐시가 있으면 캐시 사용, 없으면 fetch
      if (cacheRef.current[branchId]) {
        const cached = cacheRef.current[branchId];
        setReviews(cached.reviews);
        setTotal(cached.total);
        setPage(cached.page);
        setHasMore(cached.reviews.length < cached.total);
        setLoading(false);
      } else {
        setReviews([]);
        setPage(1);
        setTotal(0);
        fetchReviews(1, true);
      }
    }
  }, [branchId]);

  const fetchReviews = useCallback(async (targetPage = 1, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const response = await reviewAPI.getByBranch(branchId, { page: targetPage, pageSize: PAGE_SIZE });
      const newReviews = response.data?.reviews || [];
      const newTotal = response.data?.total || 0;

      const updatedReviews = isInitial ? newReviews : [...reviews, ...newReviews];
      setReviews(updatedReviews);
      setTotal(newTotal);
      setPage(targetPage);
      setHasMore(updatedReviews.length < newTotal);

      // 캐시 업데이트
      cacheRef.current[branchId] = {
        reviews: updatedReviews,
        total: newTotal,
        page: targetPage,
      };
    } catch (err) {
      console.error('리뷰 조회 실패:', err);
      if (isInitial) setReviews([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [branchId, reviews]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchReviews(page + 1, false);
    }
  };

  const invalidateCache = () => {
    delete cacheRef.current[branchId];
  };

  const handleSubmit = async () => {
    if (!newReview.trim()) return;

    setSubmitting(true);
    try {
      await reviewAPI.create({
        branch_id: branchId,
        content: newReview.trim(),
        rating,
      });
      success('리뷰가 등록되었습니다');
      setNewReview('');
      setRating(5);
      invalidateCache();
      fetchReviews(1, true);
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
      invalidateCache();
      fetchReviews(1, true);
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
      invalidateCache();
      fetchReviews(1, true);
    } catch (err) {
      console.error('리뷰 수정 실패:', err);
      showError('리뷰 수정에 실패했습니다');
    }
  };

  const renderStars = (count, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition`}
          >
            <svg
              className={`${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} ${star <= count ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div>
      {!compact && <h3 className="text-lg font-bold text-gray-900 mb-4">지점 리뷰</h3>}

      {/* 리뷰 작성 폼 */}
      <div className={`bg-white border border-gray-200 rounded-lg ${compact ? 'p-2 mb-2' : 'p-4 mb-4'}`}>
        <div className={`flex items-center gap-2 ${compact ? 'mb-2' : 'gap-3 mb-3'}`}>
          <span className={`font-medium text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>평점:</span>
          {renderStars(rating, true, setRating)}
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>{rating}점</span>
        </div>
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
          <>
            {reviews.map((review) => {
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
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                          {review.created_at && (
                            <span className="text-xs text-gray-400">
                              {compact ? new Date(review.created_at).toLocaleDateString('ko-KR') : formatDateTime(review.created_at)}
                            </span>
                          )}
                        </div>
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
            })}

            {/* 더보기 버튼 */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`w-full text-center py-2 text-gray-500 hover:text-gray-700 transition ${compact ? 'text-xs' : 'text-sm'}`}
              >
                {loadingMore ? '불러오는 중...' : `더보기 (${reviews.length}/${total})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewBoard;
