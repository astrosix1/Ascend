/**
 * Styles for DashboardScreen. Extracted out of DashboardScreen.tsx (previously
 * a ~660-line inline StyleSheet.create at the bottom of that one file) —
 * same values, unchanged, just moved so the screen file is shorter and the
 * styles are easier to find on their own.
 */
import { StyleSheet } from 'react-native';
import { Spacing, FontSize, BorderRadius } from '../../utils/theme';

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Split-pane panels
  leftPanel: {
    flex: 0.5,
    backgroundColor: 'transparent',
  },
  rightPanel: {
    flex: 0.5,
    backgroundColor: 'transparent',
  },

  // Stats
  statRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  chartCard: {
    marginBottom: Spacing.sm,
  },
  graphContainer: {
    overflow: 'hidden',
    borderRadius: BorderRadius.sm,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  chartTitle: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },

  // Habit Checklist header row
  habitChecklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  habitChecklistHeaderLeft: {
    flex: 1,
  },

  // Habit cards container - responsive layout
  habitCardsRow: {
    flexDirection: 'column',
    marginBottom: Spacing.sm,
  },

  // Quick stats card (right panel)
  quickStatsCard: {
    marginBottom: Spacing.sm,
  },
  quickStatRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
  },

  // Journal entry compact (right panel)
  journalEntryCompact: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },

  // Real World Wins section
  winEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  winText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  winDate: {
    fontSize: FontSize.xs,
  },

  // Relapse Recovery section
  recoveryEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  recoveryHabit: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  recoveryTrigger: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
  },
  recoveryLesson: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    fontStyle: 'italic',
  },
  recoveryDate: {
    marginTop: Spacing.xs,
  },

  // Habits
  subsectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    marginTop: 0,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: FontSize.sm * 1.3,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: FontSize.md * 1.4,
  },
  habitStreak: {
    fontSize: FontSize.xs,
    marginTop: 4,
    lineHeight: FontSize.xs * 1.4,
  },
  whyBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.xs,
  },
  whyBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  relapseBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.xs,
  },
  relapseBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  temptedBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.xs,
  },
  temptedBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Calendar
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  calNavBtn: {
    padding: Spacing.xs,
  },
  calNavText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: 26,
  },
  calMonthLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  calDayLabels: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  calDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  calDayNum: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  selectedDayPanel: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  selectedDayTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  eventRowInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventTime: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    minWidth: 40,
  },
  eventTitle: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  removeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    paddingHorizontal: Spacing.xs,
  },
  addEventBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },

  // Collapsible
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  collapsibleTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  collapsibleCount: {
    fontSize: FontSize.sm,
  },

  // Wins (list row variant)
  winRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },

  // Relapse
  relapseIntro: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  relapseEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  relapseEntryHabit: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  relapseEntryDate: {
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  relapseEntryText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },

  // Journal
  journalEntry: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  journalEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  journalEntryHabit: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  journalEntryText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // Shared form elements
  habitPillBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
  },
  habitPillText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    minHeight: 44,
    marginBottom: Spacing.xs,
  },
  formButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  formBtnFlex: {
    flex: 1,
  },
  emptyNote: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
    paddingVertical: Spacing.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  adviceBox: {
    borderLeftWidth: 4,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  adviceText: {
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
    fontWeight: '500',
  },

  // Edit Habits Modal
  editHabitsModalBox: {
    maxHeight: '85%',
    paddingBottom: Spacing.lg,
  },
  editHabitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  editHabitsTitle: {
    marginBottom: 0,
  },
  editHabitsCloseBtn: {
    padding: Spacing.xs,
  },
  editHabitsScroll: {
    flexGrow: 0,
  },
  // ＋ New Habit trigger button
  addHabitTrigger: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addHabitTriggerText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  // Section label above habit list
  habitListLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  // Habit row
  editHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  editHabitInfo: {
    flex: 1,
  },
  editHabitName: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  editHabitStreak: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  habitRowActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  habitActionBtn: {
    padding: Spacing.xs,
  },
  // Inline form (shared by Add and Edit)
  inlineForm: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typePillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typePill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typePillText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#888',
  },
  typePillTextActive: {
    color: '#fff',
  },
  inlineFormActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  inlineActionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  inlineActionBtnPrimary: {
    borderWidth: 0,
  },
  inlineActionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  bottomPad: {
    height: Spacing.xl,
  },

  // Analytics & Gamification Styles
  dailyQuote: {
    fontStyle: 'italic',
  },
  streakHighlightText: {
    textAlign: 'center',
  },
  streakHighlightNumber: {
    textAlign: 'center',
  },
  streakHighlightHabit: {
    textAlign: 'center',
  },
  avoidedHabitsText: {
    textAlign: 'center',
  },
  avoidedHabitsXp: {
    textAlign: 'center',
  },
  summaryTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryTabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#888',
  },
  analyticsModal: {
    maxHeight: '90%',
    paddingBottom: Spacing.lg,
  },
  analyticsTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  analyticsTabText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  habitAnalyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  habitAnalyticsName: {
    flex: 1,
  },
  habitAnalyticsRate: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  historyModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  historyDateEntry: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDateText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  progressBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
});
