import { AlertListPanel, BudgetPanel, HealthPanel, PriorityProjectsPanel, SiteMapPanel } from './ExecutivePanels.jsx';
import { ActivityPanel, ProjectListPanel } from './SharedPanels.jsx';
import { CoordinationQueuePanel, WorkloadPanel } from './CoordinationPanels.jsx';
import { ContractualMilestonesPanel, ValidationsPanel } from './OwnerPanels.jsx';
import { DailyActionsPanel, FocusProjectPanel, WorkflowBoardPanel } from './DeliveryPanels.jsx';
import { FinancialReviewPanel, ProjectFinancePanel } from './FinancePanels.jsx';
import { KpiShelfPanel, PendingDecisionsPanel, RuleAlertsPanel } from './ReferencePanels.jsx';
import { FieldAttentionPanel, WilayaRankingPanel } from './TerritorialPanels.jsx';

// Panel registry: roleConfig.js refers to these names; nothing else decides what a role sees.
export const PANELS = {
  health: HealthPanel,
  budget: BudgetPanel,
  siteMap: SiteMapPanel,
  priorityProjects: PriorityProjectsPanel,
  alertList: AlertListPanel,
  projectList: ProjectListPanel,
  activity: ActivityPanel,
  coordinationQueue: CoordinationQueuePanel,
  workload: WorkloadPanel,
  validations: ValidationsPanel,
  contractualMilestones: ContractualMilestonesPanel,
  focusProject: FocusProjectPanel,
  dailyActions: DailyActionsPanel,
  workflowBoard: WorkflowBoardPanel,
  financialReview: FinancialReviewPanel,
  projectFinance: ProjectFinancePanel,
  wilayaRanking: WilayaRankingPanel,
  fieldAttention: FieldAttentionPanel,
  ruleAlerts: RuleAlertsPanel,
  kpiShelf: KpiShelfPanel,
  pendingDecisions: PendingDecisionsPanel
};
