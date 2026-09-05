"""
Recommendation Evaluator:
Calculates offline evaluation metrics for recommendation quality and deterministic accuracy:
- Precision@5, Precision@10
- Recall@10
- NDCG@10 (Normalized Discounted Cumulative Gain)
- Role Alignment Accuracy
- Eligibility Precision
"""

import math
from typing import List, Dict, Any, Set

class RecommendationEvaluator:
    def __init__(self):
        pass

    def calculate_precision_at_k(self, recommended_ids: List[str], relevant_ids: Set[str], k: int) -> float:
        """
        Precision@K: Proportion of top-K recommendations that are in the relevant set.
        """
        if k <= 0 or not recommended_ids:
            return 0.0
        top_k = recommended_ids[:k]
        hits = sum(1 for item_id in top_k if item_id in relevant_ids)
        return round(hits / k, 4)

    def calculate_recall_at_k(self, recommended_ids: List[str], relevant_ids: Set[str], k: int) -> float:
        """
        Recall@K: Proportion of relevant items captured in top-K recommendations.
        """
        if not relevant_ids or not recommended_ids:
            return 0.0
        top_k = recommended_ids[:k]
        hits = sum(1 for item_id in top_k if item_id in relevant_ids)
        return round(hits / len(relevant_ids), 4)

    def calculate_dcg_at_k(self, relevance_scores: List[float], k: int) -> float:
        """
        Discounted Cumulative Gain at rank K.
        DCG@K = sum_{i=1}^K (2^{rel_i} - 1) / log_2(i + 1)
        """
        dcg = 0.0
        for i, rel in enumerate(relevance_scores[:k], start=1):
            dcg += (2.0 ** rel - 1.0) / math.log2(i + 1)
        return dcg

    def calculate_ndcg_at_k(self, predicted_relevance: List[float], ground_truth_relevance: List[float], k: int) -> float:
        """
        Normalized Discounted Cumulative Gain at rank K.
        """
        if not predicted_relevance or not ground_truth_relevance:
            return 0.0

        dcg = self.calculate_dcg_at_k(predicted_relevance, k)
        ideal_relevance = sorted(ground_truth_relevance, reverse=True)
        idcg = self.calculate_dcg_at_k(ideal_relevance, k)

        if idcg == 0.0:
            return 0.0

        return round(dcg / idcg, 4)

    def evaluate_recommendations(
        self,
        recommendations: List[Dict[str, Any]],
        ground_truth: Dict[str, float]  # job_id -> relevance (0.0, 0.5, 1.0)
    ) -> Dict[str, float]:
        """
        Evaluates a ranked recommendation list against ground-truth human relevance labels.
        """
        recommended_job_ids = [r["job_id"] for r in recommendations]
        relevant_job_ids = {j_id for j_id, score in ground_truth.items() if score >= 0.5}

        # Collect predicted relevance according to rank order
        predicted_rel = [ground_truth.get(j_id, 0.0) for j_id in recommended_job_ids]
        all_ground_truth_scores = list(ground_truth.values())

        p_at_5 = self.calculate_precision_at_k(recommended_job_ids, relevant_job_ids, 5)
        p_at_10 = self.calculate_precision_at_k(recommended_job_ids, relevant_job_ids, 10)
        r_at_10 = self.calculate_recall_at_k(recommended_job_ids, relevant_job_ids, 10)
        ndcg_10 = self.calculate_ndcg_at_k(predicted_rel, all_ground_truth_scores, 10)

        # Role alignment in top 10
        role_aligned_count = sum(1 for r in recommendations[:10] if r.get("scores", {}).get("role_score", 0) >= 60.0)
        role_accuracy = round(role_aligned_count / max(1, min(10, len(recommendations))), 4)

        return {
            "precision@5": p_at_5,
            "precision@10": p_at_10,
            "recall@10": r_at_10,
            "ndcg@10": ndcg_10,
            "role_accuracy@10": role_accuracy,
            "total_ranked": len(recommendations)
        }
