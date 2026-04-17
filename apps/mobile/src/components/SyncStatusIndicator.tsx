/**
 * SyncStatusIndicator - Network and sync status badge
 *
 * Shows:
 * - Online/offline status
 * - Pending unsynced changes count
 * - Visual indicator similar to shopping-list example
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@offline/ui";

interface SyncStatusIndicatorProps {
  isConnected: boolean;
  isSyncing?: boolean;
  pendingChangesCount?: number;
}

export function SyncStatusIndicator({
  isConnected,
  isSyncing = false,
  pendingChangesCount = 0,
}: SyncStatusIndicatorProps) {
  const hasPendingChanges = pendingChangesCount > 0;

  if (!isConnected) {
    return (
      <View style={[styles.badge, styles.offlineBadge]}>
        <View style={[styles.dot, styles.offlineDot]} />
        <Text style={[styles.text, styles.offlineText]}>Offline</Text>
        {hasPendingChanges && (
          <Text style={styles.pendingCount}>
            {" "}
            ({pendingChangesCount} pending)
          </Text>
        )}
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={[styles.badge, styles.syncingBadge]}>
        <View style={[styles.dot, styles.syncingDot]} />
        <Text style={[styles.text, styles.syncingText]}>Syncing...</Text>
      </View>
    );
  }

  if (hasPendingChanges) {
    return (
      <View style={[styles.badge, styles.pendingBadge]}>
        <View style={[styles.dot, styles.pendingDot]} />
        <Text style={[styles.text, styles.pendingText]}>
          {pendingChangesCount} pending
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.onlineBadge]}>
      <View style={[styles.dot, styles.onlineDot]} />
      <Text style={[styles.text, styles.onlineText]}>Online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Online state
  onlineBadge: {
    backgroundColor: "#22c55e20",
  },
  onlineDot: {
    backgroundColor: "#22c55e",
  },
  onlineText: {
    color: "#22c55e",
  },
  // Offline state
  offlineBadge: {
    backgroundColor: "#ef444420",
  },
  offlineDot: {
    backgroundColor: "#ef4444",
  },
  offlineText: {
    color: "#ef4444",
  },
  // Syncing state
  syncingBadge: {
    backgroundColor: "#3b82f620",
  },
  syncingDot: {
    backgroundColor: "#3b82f6",
  },
  syncingText: {
    color: "#3b82f6",
  },
  // Pending changes state
  pendingBadge: {
    backgroundColor: "#f59e0b20",
  },
  pendingDot: {
    backgroundColor: "#f59e0b",
  },
  pendingText: {
    color: "#f59e0b",
  },
  pendingCount: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "500",
  },
});

/**
 * PendingItemBadge - Shows pending status on individual items
 * Similar to shopping-list example's "Saving" badge
 */
interface PendingItemBadgeProps {
  isPending: boolean;
}

export function PendingItemBadge({ isPending }: PendingItemBadgeProps) {
  if (!isPending) return null;

  return (
    <View style={itemStyles.badge}>
      <Text style={itemStyles.text}>Saving...</Text>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  badge: {
    backgroundColor: theme.color.accent + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    color: theme.color.accent,
    fontWeight: "500",
  },
});
