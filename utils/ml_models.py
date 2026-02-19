"""
Machine Learning Models for Predictive Analytics
Sprint 3, Phase 3: AI & Predictive Analytics
Created: December 1, 2025

This module contains ML models for:
- Task 3.1: Renewal prediction
- Task 3.2: Client lifetime value (CLV)
- Task 3.3: Churn risk scoring
- Task 3.4: AI-powered recommendations
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import pickle
import os

# Machine Learning Libraries (all FREE!)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


# =============================================================================
# Task 3.1: Renewal Prediction Model
# =============================================================================

class RenewalPredictor:
    """
    Predicts the likelihood of a policy renewing.

    Uses Random Forest Classifier to predict renewal probability based on:
    - Days until renewal
    - Policy type
    - Premium amount
    - Agent relationship strength
    - Claims history
    - Payment history
    - Client tenure
    """

    def __init__(self, model_path: str = None):
        """Initialize the renewal prediction model."""
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_importance = None
        self.is_trained = False

        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def prepare_features(self, policy_data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for the renewal prediction model.

        Args:
            policy_data: DataFrame with policy information

        Returns:
            DataFrame with engineered features
        """
        df = policy_data.copy()

        # Feature: Days until renewal
        df['days_until_renewal'] = (pd.to_datetime(df['expiration_date']) - datetime.now()).dt.days

        # Feature: Policy age (tenure)
        df['policy_age_days'] = (datetime.now() - pd.to_datetime(df['effective_date'])).dt.days
        df['policy_age_years'] = df['policy_age_days'] / 365.25

        # Feature: Premium amount (standardized)
        df['premium_amount'] = pd.to_numeric(df['premium'], errors='coerce').fillna(0)

        # Feature: Policy type (encode)
        if 'policy_type' in df.columns:
            if 'policy_type' not in self.label_encoders:
                self.label_encoders['policy_type'] = LabelEncoder()
                self.label_encoders['policy_type'].fit(df['policy_type'].fillna('Unknown'))
            df['policy_type_encoded'] = self.label_encoders['policy_type'].transform(df['policy_type'].fillna('Unknown'))
        else:
            df['policy_type_encoded'] = 0

        # Feature: Carrier (encode)
        if 'carrier' in df.columns:
            if 'carrier' not in self.label_encoders:
                self.label_encoders['carrier'] = LabelEncoder()
                self.label_encoders['carrier'].fit(df['carrier'].fillna('Unknown'))
            df['carrier_encoded'] = self.label_encoders['carrier'].transform(df['carrier'].fillna('Unknown'))
        else:
            df['carrier_encoded'] = 0

        # Feature: Agent relationship strength (number of policies with same agent)
        # This would come from a join with other policies - placeholder for now
        df['agent_relationship_strength'] = 1  # Default value

        # Feature: Claims history (placeholder - would come from claims table)
        df['has_claims'] = 0  # 0 = no claims, 1 = has claims
        df['claims_count'] = 0

        # Feature: Payment history (placeholder - would come from payments table)
        df['payment_score'] = 100  # 0-100 score
        df['late_payments_count'] = 0

        # Feature: Seasonality (month of renewal)
        df['renewal_month'] = pd.to_datetime(df['expiration_date']).dt.month
        df['renewal_quarter'] = pd.to_datetime(df['expiration_date']).dt.quarter

        # Feature: Premium change indicator (if available)
        df['premium_increased'] = 0  # 0 or 1

        # Select features for model
        feature_columns = [
            'days_until_renewal',
            'policy_age_years',
            'premium_amount',
            'policy_type_encoded',
            'carrier_encoded',
            'agent_relationship_strength',
            'has_claims',
            'claims_count',
            'payment_score',
            'late_payments_count',
            'renewal_month',
            'renewal_quarter',
            'premium_increased'
        ]

        return df[feature_columns]

    def train(self, training_data: pd.DataFrame, target_column: str = 'renewed') -> Dict:
        """
        Train the renewal prediction model.

        Args:
            training_data: Historical policy data with renewal outcomes
            target_column: Name of the column indicating if policy renewed (1) or not (0)

        Returns:
            Dictionary with training metrics
        """
        # Prepare features
        X = self.prepare_features(training_data)
        y = training_data[target_column]

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True

        # Get feature importance
        self.feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        # Evaluate on test set
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'train_size': len(X_train),
            'test_size': len(X_test)
        }

        return metrics

    def predict_renewal_probability(self, policy_data: pd.DataFrame) -> pd.DataFrame:
        """
        Predict renewal probability for policies.

        Args:
            policy_data: DataFrame with policy information

        Returns:
            DataFrame with renewal probabilities and risk categories
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        # Prepare features
        X = self.prepare_features(policy_data)
        X_scaled = self.scaler.transform(X)

        # Predict
        probabilities = self.model.predict_proba(X_scaled)[:, 1]
        predictions = self.model.predict(X_scaled)

        # Create results DataFrame
        results = policy_data.copy()
        results['renewal_probability'] = probabilities
        results['renewal_prediction'] = predictions

        # Categorize risk
        results['renewal_risk'] = results['renewal_probability'].apply(self._categorize_renewal_risk)

        # Add recommendations
        results['recommendation'] = results.apply(self._generate_renewal_recommendation, axis=1)

        return results

    def _categorize_renewal_risk(self, probability: float) -> str:
        """Categorize renewal probability into risk levels."""
        if probability >= 0.8:
            return 'Very Low Risk'
        elif probability >= 0.6:
            return 'Low Risk'
        elif probability >= 0.4:
            return 'Medium Risk'
        elif probability >= 0.2:
            return 'High Risk'
        else:
            return 'Critical Risk'

    def _generate_renewal_recommendation(self, row: pd.Series) -> str:
        """Generate recommendation based on renewal probability."""
        prob = row['renewal_probability']

        if prob >= 0.8:
            return "Low risk - maintain regular contact"
        elif prob >= 0.6:
            return "Schedule renewal review call"
        elif prob >= 0.4:
            return "Proactive outreach needed - review coverage and pricing"
        elif prob >= 0.2:
            return "High risk - urgent intervention required, consider retention offer"
        else:
            return "Critical risk - immediate contact, escalate to senior agent"

    def save_model(self, model_path: str):
        """Save the trained model to disk."""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_importance': self.feature_importance,
            'is_trained': self.is_trained
        }
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)

    def load_model(self, model_path: str):
        """Load a trained model from disk."""
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)

        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.label_encoders = model_data['label_encoders']
        self.feature_importance = model_data['feature_importance']
        self.is_trained = model_data['is_trained']


# =============================================================================
# Task 3.2: Client Lifetime Value (CLV) Calculation
# =============================================================================

class CLVCalculator:
    """
    Calculate Client Lifetime Value (CLV) for insurance clients.

    CLV Formula:
    CLV = (Average Annual Premium × Retention Rate × Average Lifespan) - Acquisition Cost
    """

    def __init__(self):
        """Initialize CLV calculator."""
        self.default_acquisition_cost = 500  # Default acquisition cost per client
        self.default_lifespan_years = 7  # Average client lifespan in years
        self.default_retention_rate = 0.85  # 85% retention rate

    def calculate_clv(self, client_policies: pd.DataFrame, **kwargs) -> Dict:
        """
        Calculate CLV for a client.

        Args:
            client_policies: DataFrame with all policies for the client
            **kwargs: Optional parameters (acquisition_cost, retention_rate, lifespan_years)

        Returns:
            Dictionary with CLV calculation details
        """
        # Get parameters
        acquisition_cost = kwargs.get('acquisition_cost', self.default_acquisition_cost)
        retention_rate = kwargs.get('retention_rate', self._calculate_retention_rate(client_policies))
        lifespan_years = kwargs.get('lifespan_years', self._calculate_lifespan(client_policies))

        # Calculate average annual premium
        avg_annual_premium = self._calculate_avg_annual_premium(client_policies)

        # Calculate CLV
        clv = (avg_annual_premium * retention_rate * lifespan_years) - acquisition_cost

        # Calculate present value (discounted CLV with 10% discount rate)
        discount_rate = 0.10
        present_value = self._calculate_present_value(
            avg_annual_premium, retention_rate, lifespan_years, acquisition_cost, discount_rate
        )

        # Categorize client value tier
        tier = self._categorize_value_tier(clv)

        return {
            'clv': round(clv, 2),
            'clv_present_value': round(present_value, 2),
            'avg_annual_premium': round(avg_annual_premium, 2),
            'retention_rate': round(retention_rate, 3),
            'lifespan_years': round(lifespan_years, 1),
            'acquisition_cost': acquisition_cost,
            'tier': tier,
            'total_policies': len(client_policies),
            'calculation_date': datetime.now().isoformat()
        }

    def _calculate_avg_annual_premium(self, policies: pd.DataFrame) -> float:
        """Calculate average annual premium across all policies."""
        if len(policies) == 0:
            return 0

        total_premium = policies['premium'].sum()
        return total_premium

    def _calculate_retention_rate(self, policies: pd.DataFrame) -> float:
        """Calculate retention rate based on historical renewals."""
        if len(policies) == 0:
            return self.default_retention_rate

        # Count renewed vs not renewed policies
        renewed_count = policies[policies.get('renewed', False) == True].shape[0]
        total_eligible = policies.shape[0]

        if total_eligible == 0:
            return self.default_retention_rate

        return renewed_count / total_eligible

    def _calculate_lifespan(self, policies: pd.DataFrame) -> float:
        """Calculate average client lifespan."""
        if len(policies) == 0:
            return self.default_lifespan_years

        # Find oldest policy
        oldest_date = pd.to_datetime(policies['effective_date']).min()
        years_active = (datetime.now() - oldest_date).days / 365.25

        # If client is new (< 1 year), use default
        if years_active < 1:
            return self.default_lifespan_years

        return years_active

    def _calculate_present_value(
        self, annual_premium: float, retention_rate: float,
        lifespan: float, acquisition_cost: float, discount_rate: float
    ) -> float:
        """Calculate present value of CLV with discount rate."""
        pv = 0
        for year in range(1, int(lifespan) + 1):
            # Revenue in year N, discounted to present value
            year_revenue = annual_premium * (retention_rate ** year)
            discounted_revenue = year_revenue / ((1 + discount_rate) ** year)
            pv += discounted_revenue

        return pv - acquisition_cost

    def _categorize_value_tier(self, clv: float) -> str:
        """Categorize client into value tiers."""
        if clv >= 10000:
            return 'Platinum'
        elif clv >= 5000:
            return 'Gold'
        elif clv >= 2000:
            return 'Silver'
        else:
            return 'Bronze'

    def calculate_clv_for_all_clients(self, policies_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate CLV for all clients in the database.

        Args:
            policies_df: DataFrame with all policies

        Returns:
            DataFrame with CLV for each client
        """
        results = []

        # Group by client
        for client_id, client_policies in policies_df.groupby('insured_name'):
            clv_data = self.calculate_clv(client_policies)
            clv_data['client_id'] = client_id
            results.append(clv_data)

        return pd.DataFrame(results)


# =============================================================================
# Task 3.3: Churn Risk Scoring
# =============================================================================

class ChurnRiskScorer:
    """
    Calculate churn risk scores for clients (0-100 scale, 100 = highest risk).

    Risk factors:
    - Multiple recent claims
    - Payment delays
    - Decreased engagement
    - Negative sentiment
    - Previous non-renewals
    - Premium increases
    """

    def __init__(self):
        """Initialize churn risk scorer."""
        # Weights for different risk factors (must sum to 1.0)
        self.weights = {
            'claims': 0.25,
            'payments': 0.25,
            'engagement': 0.20,
            'premium_change': 0.15,
            'policy_changes': 0.10,
            'tenure': 0.05
        }

    def calculate_churn_risk(self, client_data: Dict) -> Dict:
        """
        Calculate overall churn risk score for a client.

        Args:
            client_data: Dictionary with client information

        Returns:
            Dictionary with churn risk details
        """
        # Calculate individual risk factors
        claims_score = self._calculate_claims_risk(client_data)
        payments_score = self._calculate_payment_risk(client_data)
        engagement_score = self._calculate_engagement_risk(client_data)
        premium_score = self._calculate_premium_change_risk(client_data)
        policy_score = self._calculate_policy_changes_risk(client_data)
        tenure_score = self._calculate_tenure_risk(client_data)

        # Calculate weighted total risk score (0-100)
        total_risk = (
            claims_score * self.weights['claims'] +
            payments_score * self.weights['payments'] +
            engagement_score * self.weights['engagement'] +
            premium_score * self.weights['premium_change'] +
            policy_score * self.weights['policy_changes'] +
            tenure_score * self.weights['tenure']
        )

        # Categorize risk level
        risk_level = self._categorize_risk_level(total_risk)

        # Generate retention strategy
        strategy = self._generate_retention_strategy(total_risk, {
            'claims': claims_score,
            'payments': payments_score,
            'engagement': engagement_score,
            'premium': premium_score
        })

        return {
            'churn_risk_score': round(total_risk, 1),
            'risk_level': risk_level,
            'risk_factors': {
                'claims_risk': round(claims_score, 1),
                'payment_risk': round(payments_score, 1),
                'engagement_risk': round(engagement_score, 1),
                'premium_change_risk': round(premium_score, 1),
                'policy_changes_risk': round(policy_score, 1),
                'tenure_risk': round(tenure_score, 1)
            },
            'retention_strategy': strategy,
            'alert_agent': total_risk >= 70,
            'calculated_at': datetime.now().isoformat()
        }

    def _calculate_claims_risk(self, data: Dict) -> float:
        """Calculate risk score based on claims history (0-100)."""
        claims_count = data.get('claims_count', 0)
        recent_claims = data.get('recent_claims_count', 0)  # Last 12 months

        # Base score from total claims
        score = min(claims_count * 15, 50)

        # Add weight for recent claims
        score += min(recent_claims * 25, 50)

        return min(score, 100)

    def _calculate_payment_risk(self, data: Dict) -> float:
        """Calculate risk score based on payment history (0-100)."""
        late_payments = data.get('late_payments_count', 0)
        payment_score = data.get('payment_score', 100)  # 0-100 score

        # Convert payment score to risk (inverse)
        risk = 100 - payment_score

        # Add penalty for late payments
        risk += late_payments * 10

        return min(risk, 100)

    def _calculate_engagement_risk(self, data: Dict) -> float:
        """Calculate risk score based on client engagement (0-100)."""
        days_since_contact = data.get('days_since_last_contact', 365)
        response_rate = data.get('response_rate', 0.5)  # 0-1 scale

        # High risk if no contact in > 180 days
        contact_risk = min((days_since_contact / 180) * 50, 50)

        # High risk if low response rate
        response_risk = (1 - response_rate) * 50

        return contact_risk + response_risk

    def _calculate_premium_change_risk(self, data: Dict) -> float:
        """Calculate risk score based on premium changes (0-100)."""
        premium_increase_pct = data.get('premium_increase_percent', 0)

        # Risk increases with premium increases
        if premium_increase_pct > 20:
            return 100
        elif premium_increase_pct > 10:
            return 70
        elif premium_increase_pct > 5:
            return 40
        elif premium_increase_pct > 0:
            return 20
        else:
            return 0

    def _calculate_policy_changes_risk(self, data: Dict) -> float:
        """Calculate risk score based on policy changes (0-100)."""
        coverage_decreased = data.get('coverage_decreased', False)
        policies_cancelled = data.get('policies_cancelled_count', 0)

        risk = 0
        if coverage_decreased:
            risk += 50

        risk += policies_cancelled * 25

        return min(risk, 100)

    def _calculate_tenure_risk(self, data: Dict) -> float:
        """Calculate risk score based on client tenure (0-100)."""
        years_active = data.get('years_active', 0)

        # New clients are higher risk
        if years_active < 1:
            return 80
        elif years_active < 2:
            return 50
        elif years_active < 5:
            return 20
        else:
            return 10

    def _categorize_risk_level(self, score: float) -> str:
        """Categorize risk score into levels."""
        if score >= 80:
            return 'Critical'
        elif score >= 60:
            return 'High'
        elif score >= 40:
            return 'Medium'
        elif score >= 20:
            return 'Low'
        else:
            return 'Very Low'

    def _generate_retention_strategy(self, total_risk: float, factors: Dict) -> str:
        """Generate personalized retention strategy."""
        if total_risk >= 80:
            # Critical risk - immediate intervention
            return "URGENT: Schedule immediate call with senior agent. Offer retention discount (up to 15%). Review all policies and coverage needs."

        elif total_risk >= 60:
            # High risk - proactive outreach
            top_factor = max(factors, key=factors.get)

            if top_factor == 'claims':
                return "High claims activity detected. Schedule claims review call. Discuss coverage adequacy and risk management."
            elif top_factor == 'payments':
                return "Payment issues detected. Offer payment plan options. Review budget-friendly coverage alternatives."
            elif top_factor == 'engagement':
                return "Low engagement. Initiate friendly check-in. Offer policy review and value-add services."
            elif top_factor == 'premium':
                return "Premium increase sensitivity. Explain value and coverage benefits. Consider loyalty discount."

        elif total_risk >= 40:
            # Medium risk - routine monitoring
            return "Moderate risk. Include in next quarterly review. Monitor for changes."

        else:
            # Low risk - maintain relationship
            return "Low risk. Maintain regular contact schedule. Focus on cross-sell opportunities."


# =============================================================================
# Task 3.4: AI-Powered Recommendations Engine
# =============================================================================

class RecommendationEngine:
    """
    Generate AI-powered recommendations for agents.

    Recommendation types:
    - Cross-sell opportunities
    - Upsell opportunities
    - Optimal contact timing
    - Retention strategies
    - Prospecting leads
    """

    def __init__(self):
        """Initialize recommendation engine."""
        self.recommendation_types = [
            'cross_sell',
            'upsell',
            'retention',
            'contact_timing',
            'prospecting'
        ]

    def get_recommendations(self, agent_id: str, context: Dict) -> List[Dict]:
        """
        Generate all recommendations for an agent.

        Args:
            agent_id: Agent ID
            context: Context data (policies, clients, etc.)

        Returns:
            List of recommendations sorted by priority
        """
        recommendations = []

        # Generate different types of recommendations
        recommendations.extend(self._generate_cross_sell_recommendations(context))
        recommendations.extend(self._generate_upsell_recommendations(context))
        recommendations.extend(self._generate_retention_recommendations(context))
        recommendations.extend(self._generate_contact_timing_recommendations(context))
        recommendations.extend(self._generate_prospecting_recommendations(context))

        # Sort by priority (score)
        recommendations.sort(key=lambda x: x['priority_score'], reverse=True)

        # Add rank
        for i, rec in enumerate(recommendations, 1):
            rec['rank'] = i

        return recommendations

    def _generate_cross_sell_recommendations(self, context: Dict) -> List[Dict]:
        """Generate cross-sell opportunities."""
        recommendations = []
        clients = context.get('clients', [])

        for client in clients:
            policies = client.get('policies', [])
            policy_types = [p['policy_type'] for p in policies]

            # Auto + Home bundle
            if 'Auto' in policy_types and 'Home' not in policy_types:
                recommendations.append({
                    'type': 'cross_sell',
                    'client_id': client['id'],
                    'client_name': client['name'],
                    'title': 'Home Insurance Cross-Sell',
                    'description': f"{client['name']} has auto insurance but no home insurance. Bundle opportunity!",
                    'action': 'Call client to discuss home insurance bundle discount',
                    'potential_value': 1500,  # Annual premium estimate
                    'priority_score': 85,
                    'success_probability': 0.65
                })

            # Life insurance upsell
            if 'Auto' in policy_types or 'Home' in policy_types:
                if 'Life' not in policy_types:
                    recommendations.append({
                        'type': 'cross_sell',
                        'client_id': client['id'],
                        'client_name': client['name'],
                        'title': 'Life Insurance Opportunity',
                        'description': f"{client['name']} may benefit from life insurance coverage",
                        'action': 'Schedule life insurance needs assessment',
                        'potential_value': 2000,
                        'priority_score': 70,
                        'success_probability': 0.40
                    })

            # Umbrella policy for high-value clients
            total_coverage = sum([p.get('coverage_amount', 0) for p in policies])
            if total_coverage > 500000 and 'Umbrella' not in policy_types:
                recommendations.append({
                    'type': 'cross_sell',
                    'client_id': client['id'],
                    'client_name': client['name'],
                    'title': 'Umbrella Policy Recommendation',
                    'description': f"{client['name']} has high coverage limits. Umbrella policy recommended.",
                    'action': 'Discuss umbrella policy for additional liability protection',
                    'potential_value': 800,
                    'priority_score': 75,
                    'success_probability': 0.55
                })

        return recommendations

    def _generate_upsell_recommendations(self, context: Dict) -> List[Dict]:
        """Generate upsell opportunities."""
        recommendations = []
        clients = context.get('clients', [])

        for client in clients:
            policies = client.get('policies', [])

            for policy in policies:
                coverage = policy.get('coverage_amount', 0)
                policy_type = policy.get('policy_type', '')

                # Low coverage upsell
                if policy_type == 'Auto' and coverage < 300000:
                    recommendations.append({
                        'type': 'upsell',
                        'client_id': client['id'],
                        'client_name': client['name'],
                        'title': 'Increase Auto Coverage',
                        'description': f"{client['name']} has only ${coverage:,.0f} coverage. Recommend increasing to $500k.",
                        'action': 'Review coverage limits and recommend increase',
                        'potential_value': 200,  # Additional premium
                        'priority_score': 60,
                        'success_probability': 0.50
                    })

                # Deductible optimization
                deductible = policy.get('deductible', 0)
                if deductible > 1000:
                    recommendations.append({
                        'type': 'upsell',
                        'client_id': client['id'],
                        'client_name': client['name'],
                        'title': 'Lower Deductible Offer',
                        'description': f"{client['name']} has high deductible (${deductible}). Offer lower deductible for peace of mind.",
                        'action': 'Discuss lowering deductible to reduce out-of-pocket risk',
                        'potential_value': 150,
                        'priority_score': 50,
                        'success_probability': 0.45
                    })

        return recommendations

    def _generate_retention_recommendations(self, context: Dict) -> List[Dict]:
        """Generate retention strategy recommendations."""
        recommendations = []
        high_risk_clients = context.get('high_risk_clients', [])

        for client in high_risk_clients:
            churn_risk = client.get('churn_risk_score', 0)

            if churn_risk >= 70:
                recommendations.append({
                    'type': 'retention',
                    'client_id': client['id'],
                    'client_name': client['name'],
                    'title': f'High Churn Risk: {client["name"]}',
                    'description': f"Churn risk score: {churn_risk}. Immediate intervention required.",
                    'action': client.get('retention_strategy', 'Schedule urgent retention call'),
                    'potential_value': -5000,  # Negative = revenue at risk
                    'priority_score': 95,
                    'success_probability': 0.30
                })

        return recommendations

    def _generate_contact_timing_recommendations(self, context: Dict) -> List[Dict]:
        """Generate optimal contact timing recommendations."""
        recommendations = []
        policies = context.get('upcoming_renewals', [])

        for policy in policies:
            days_until_renewal = policy.get('days_until_renewal', 0)

            if 25 <= days_until_renewal <= 35:
                recommendations.append({
                    'type': 'contact_timing',
                    'client_id': policy['client_id'],
                    'client_name': policy['client_name'],
                    'title': f'Renewal Follow-Up: {policy["client_name"]}',
                    'description': f"Policy renewing in {days_until_renewal} days. Optimal contact window.",
                    'action': 'Call to discuss renewal and review coverage',
                    'potential_value': 0,
                    'priority_score': 80,
                    'success_probability': 0.70
                })

        return recommendations

    def _generate_prospecting_recommendations(self, context: Dict) -> List[Dict]:
        """Generate prospecting lead recommendations."""
        recommendations = []

        # Life events (would come from external data)
        life_events = context.get('life_events', [])

        for event in life_events:
            recommendations.append({
                'type': 'prospecting',
                'client_id': event.get('client_id'),
                'client_name': event.get('client_name'),
                'title': f"Life Event: {event['event_type']}",
                'description': f"{event['client_name']} recently {event['event_type']}. Insurance needs may have changed.",
                'action': f"Reach out regarding {event['event_type']} and insurance review",
                'potential_value': event.get('potential_value', 1000),
                'priority_score': 75,
                'success_probability': 0.55
            })

        return recommendations


# =============================================================================
# Utility Functions
# =============================================================================

def train_renewal_model_from_database(supabase, model_save_path: str = 'models/renewal_model.pkl'):
    """
    Train the renewal prediction model using historical data from the database.

    Args:
        supabase: Supabase client
        model_save_path: Path to save the trained model

    Returns:
        Training metrics
    """
    # Fetch historical policy data
    # This would need actual database queries
    # For now, return placeholder

    predictor = RenewalPredictor()

    # TODO: Implement actual database fetch
    # training_data = fetch_historical_renewals(supabase)
    # metrics = predictor.train(training_data)
    # predictor.save_model(model_save_path)

    return {
        'status': 'Model training requires historical renewal data',
        'recommendation': 'Collect 6-12 months of renewal outcomes before training'
    }


def score_all_policies_for_renewal(supabase, agent_id: str = None) -> pd.DataFrame:
    """
    Score all active policies for renewal probability.

    Args:
        supabase: Supabase client
        agent_id: Optional agent ID to filter policies

    Returns:
        DataFrame with renewal predictions
    """
    # TODO: Implement actual database fetch and scoring
    pass


def calculate_clv_for_all_clients(supabase, agency_id: str) -> pd.DataFrame:
    """
    Calculate CLV for all clients in an agency.

    Args:
        supabase: Supabase client
        agency_id: Agency ID

    Returns:
        DataFrame with CLV for all clients
    """
    # TODO: Implement actual calculation
    pass


if __name__ == "__main__":
    print("ML Models module loaded successfully!")
    print("Available models:")
    print("  - RenewalPredictor: Predict policy renewal probability")
    print("  - CLVCalculator: Calculate client lifetime value")
    print("  - ChurnRiskScorer: Score churn risk for clients")
    print("  - RecommendationEngine: Generate AI-powered recommendations")
