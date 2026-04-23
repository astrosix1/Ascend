import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Linking, RefreshControl,
} from 'react-native';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import SectionHeader from '../../components/SectionHeader';
import { Spacing, FontSize, BorderRadius, FontWeight, LineHeight } from '../../utils/theme';
import { CommunityEvent } from '../../utils/types';
import { fetchLocalEvents } from '../../utils/eventsApi';
import {
  fetchPosts, fetchFeaturedPost, createPost,
  fetchComments, createComment, deletePost, updatePost,
  updateComment, deleteComment,
  DBForumPost, DBForumComment,
} from '../../utils/supabase';
import { isSupabaseReady } from '../../utils/runtimeConfig';
import { useScreenWidth, BREAKPOINTS } from '../../utils/responsive';
import { containsProfanity, getProfanityWarning } from '../../utils/profanityFilter';

type CommunityTab = 'events' | 'forums';

const FORUM_CATEGORIES = [
  'All', 'Digital Detox', 'Habits', 'Mental Health',
  'Relapse Recovery', 'Addiction Recovery', 'Fitness', 'Social',
];

export default function CommunityScreen() {
  const { colors, settings, addCalendarEvent, removeCalendarEvent, forumFavorites, toggleForumFavorite, currentUserId } = useApp();
  const screenWidth = useScreenWidth();
  const desktop = screenWidth > BREAKPOINTS.tablet;
  // Derive ready-state at render time so it reacts to in-app config saves
  const sbReady = isSupabaseReady();
  const [activeTab, setActiveTab] = useState<CommunityTab>('events');

  // ─── EVENTS ────────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [eventsGoing, setEventsGoing] = useState<Record<string, boolean>>({});
  // Track which calendar event ID was added per community event (for removal)
  const [eventCalendarIds, setEventCalendarIds] = useState<Record<string, string>>({});

  const loadEvents = useCallback(async () => {
    if (!settings.location) {
      setEventsError('no_location');
      return;
    }
    setEventsLoading(true);
    setEventsError('');
    try {
      const results = await fetchLocalEvents(settings.location);
      setEvents(results);
      if (results.length === 0) setEventsError('no_results');
    } catch {
      setEventsError('fetch_failed');
    } finally {
      setEventsLoading(false);
    }
  }, [settings.location]);

  useEffect(() => {
    if (activeTab === 'events') loadEvents();
  }, [activeTab, loadEvents]);

  const markGoing = (event: CommunityEvent) => {
    const isNowGoing = !eventsGoing[event.id];
    setEventsGoing(prev => ({ ...prev, [event.id]: isNowGoing }));

    if (isNowGoing) {
      const calId = `event_${event.id}_${Date.now()}`;
      addCalendarEvent({
        id: calId,
        title: event.title,
        date: event.date,
        time: event.time,
        description: event.description,
        fromCommunity: true,
        eventId: event.id,
      });
      setEventCalendarIds(prev => ({ ...prev, [event.id]: calId }));
      Alert.alert('Added to Calendar', `"${event.title}" has been added to your calendar.`);
    } else {
      // Remove from calendar
      const calId = eventCalendarIds[event.id];
      if (calId) {
        removeCalendarEvent(calId);
        setEventCalendarIds(prev => { const n = { ...prev }; delete n[event.id]; return n; });
      }
    }
  };

  const openMap = (event: CommunityEvent) => {
    const { latitude, longitude, name } = event.location;
    const url = latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : `https://maps.google.com/?q=${encodeURIComponent(name)}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open maps'));
  };

  const openEventUrl = (url?: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  // ─── FORUMS ────────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<DBForumPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<DBForumPost | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsRefreshing, setPostsRefreshing] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [selectedPost, setSelectedPost] = useState<DBForumPost | null>(null);
  const [postComments, setPostComments] = useState<DBForumComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [forumCategory, setForumCategory] = useState('All');
  const [forumSearch, setForumSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentPosting, setCommentPosting] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Habits');
  const [newPostTags, setNewPostTags] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Edit mode states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // 5-minute forum time limit
  const forumStartTime = useRef<number>(0);
  const [forumTimeWarning, setForumTimeWarning] = useState(false);
  const forumTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPosts = useCallback(async (silent = false) => {
    if (!sbReady) { setPostsError('setup_required'); return; }
    if (!silent) setPostsLoading(true);
    setPostsError('');
    try {
      const [allPosts, featured] = await Promise.all([
        fetchPosts(forumCategory === 'All' ? undefined : forumCategory),
        fetchFeaturedPost(),
      ]);
      setPosts(allPosts);
      setFeaturedPost(featured);
      // Auto-select first post on desktop
      if (desktop && allPosts.length > 0 && !selectedPost) {
        openPost(allPosts[0]);
      }
    } catch {
      setPostsError('fetch_failed');
    } finally {
      setPostsLoading(false);
      setPostsRefreshing(false);
    }
  }, [forumCategory, desktop, selectedPost]);

  useEffect(() => {
    if (activeTab === 'forums') {
      loadPosts();
      forumStartTime.current = Date.now();
      forumTimer.current = setInterval(() => {
        const elapsed = (Date.now() - forumStartTime.current) / 1000 / 60;
        if (elapsed >= 5) setForumTimeWarning(true);
      }, 30_000);
    } else {
      if (forumTimer.current) clearInterval(forumTimer.current);
      setForumTimeWarning(false);
    }
    return () => { if (forumTimer.current) clearInterval(forumTimer.current); };
  }, [activeTab, loadPosts]);

  useEffect(() => {
    if (activeTab === 'forums' && sbReady) loadPosts();
  }, [forumCategory]);

  const openPost = async (post: DBForumPost) => {
    setSelectedPost(post);
    setPostComments([]);
    setCommentsLoading(true);
    try {
      const comments = await fetchComments(post.id);
      setPostComments(comments);
    } catch { /* ignore */ } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!currentUserId) {
      Alert.alert('Sign in required', 'Please sign in to comment. Go to Settings and use the Auth section.');
      return;
    }
    if (!selectedPost || !newComment.trim()) return;
    setCommentPosting(true);
    try {
      const comment = await createComment({
        post_id: selectedPost.id,
        body: newComment.trim(),
        author_name: 'Anonymous',
      });
      setPostComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not post comment. Please try again.');
    } finally {
      setCommentPosting(false);
    }
  };

  const submitNewPost = async () => {
    if (!currentUserId) {
      Alert.alert('Sign in required', 'Please sign in to post. Go to Settings and use the Auth section.');
      return;
    }
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      Alert.alert('Incomplete', 'Please add a title and body.');
      return;
    }
    if (containsProfanity(newPostTitle) || containsProfanity(newPostBody)) {
      Alert.alert('Language Policy', `${getProfanityWarning()} This post cannot be submitted.`);
      return;
    }
    setPostSubmitting(true);
    try {
      console.log('Submitting post:', { title: newPostTitle, body: newPostBody, userId: currentUserId });
      const newPost = await createPost({
        title: newPostTitle.trim(),
        body: newPostBody.trim(),
        author_name: 'Anonymous',
        category: newPostCategory,
        tags: newPostTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      console.log('Post created:', newPost);
      setShowNewPost(false);
      setNewPostTitle(''); setNewPostBody(''); setNewPostTags('');
      Alert.alert('Success', 'Your post has been published!');
      // Reload posts after a brief delay to ensure DB is updated
      setTimeout(() => loadPosts(), 500);
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Error', err.message || 'Could not submit post. Please try again.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    Alert.alert(
      'Delete Post?',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deletePost(selectedPost.id);
              if (result.success) {
                setSelectedPost(null);
                Alert.alert('Deleted', 'Your post has been deleted.');
                loadPosts();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete post.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete post.');
            }
          },
        },
      ],
    );
  };

  const handleEditPost = async () => {
    if (!selectedPost || !editPostTitle.trim() || !editPostContent.trim()) {
      Alert.alert('Incomplete', 'Please fill in title and content.');
      return;
    }
    try {
      const updated = await updatePost(selectedPost.id, {
        title: editPostTitle.trim(),
        content: editPostContent.trim(),
      });
      if (updated) {
        setSelectedPost(updated);
        setEditingPostId(null);
        Alert.alert('Success', 'Your post has been updated.');
        loadPosts();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update post.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment?',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteComment(commentId);
              if (result.success) {
                setPostComments(prev => prev.filter(c => c.id !== commentId));
                Alert.alert('Deleted', 'Your comment has been deleted.');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete comment.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete comment.');
            }
          },
        },
      ],
    );
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) {
      Alert.alert('Empty', 'Please enter comment content.');
      return;
    }
    try {
      const updated = await updateComment(commentId, editCommentContent.trim());
      setPostComments(prev => prev.map(c => c.id === commentId ? updated : c));
      setEditingCommentId(null);
      Alert.alert('Success', 'Your comment has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update comment.');
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = !forumSearch ||
      p.title.toLowerCase().includes(forumSearch.toLowerCase()) ||
      (p.tags || []).some(t => t.includes(forumSearch.toLowerCase()));
    const matchFav = !showFavoritesOnly || forumFavorites.includes(p.id);
    return matchSearch && matchFav;
  });

  // ─── STYLES ────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    tabRow: {
      flexDirection: 'row', backgroundColor: colors.surface,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
    tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: FontSize.sm * LineHeight.normal },
    scroll: { flex: 1, padding: Spacing.md },
    badge: { paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.full },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, color: colors.text, backgroundColor: colors.surface, fontSize: FontSize.sm,
      lineHeight: FontSize.sm * LineHeight.normal,
    },
    warningBanner: {
      backgroundColor: colors.accentLight, borderRadius: BorderRadius.sm,
      padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.accent,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    postTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.xs, lineHeight: FontSize.md * LineHeight.tight },
    postMeta: { fontSize: FontSize.xs, color: colors.textSecondary, lineHeight: FontSize.xs * LineHeight.normal },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
    tag: { paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: colors.surfaceLight },
    setupCard: { borderLeftWidth: 3, borderLeftColor: colors.accent, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, marginBottom: Spacing.md },
    commentCard: { padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: colors.surface, marginBottom: Spacing.xs },
  });

  const SetupPrompt = ({ feature, docsUrl }: { feature: string; docsUrl: string }) => (
    <View style={s.setupCard}>
      <Text style={{ color: colors.accent, fontWeight: '700', marginBottom: Spacing.xs }}>
        Setup required — {feature}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm }}>
        To show real {feature.toLowerCase()}, add your API key to{' '}
        <Text style={{ color: colors.text, fontFamily: 'monospace' }}>src/utils/config.ts</Text>.
        Get a free key at the link below.
      </Text>
      <TouchableOpacity onPress={() => Linking.openURL(docsUrl)}>
        <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>{docsUrl} →</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── EVENTS VIEW ───────────────────────────────────────────────────────────
  const renderEvents = () => {

    return (
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={eventsLoading} onRefresh={loadEvents} tintColor={colors.accent} />}
      >
        <SectionHeader title="Local Events" subtitle={settings.location ? `Near ${settings.location}` : 'Set your location in Settings'} />

        {!settings.location && (
          <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.warning }}>
            <Text style={{ color: colors.warning, fontWeight: '600', marginBottom: 2 }}>No location set</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>
              Set your city in Settings → Location to see local events.
            </Text>
          </Card>
        )}

        {eventsLoading && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>Finding events near you...</Text>
          </View>
        )}

        {!eventsLoading && eventsError === 'no_results' && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
            <Text style={{ fontSize: 48, color: colors.textSecondary, marginBottom: Spacing.sm }}>📅</Text>
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>No events found near {settings.location}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}>Try a different city in Settings</Text>
          </View>
        )}

        {!eventsLoading && eventsError === 'fetch_failed' && (
          <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontWeight: '600' }}>Could not load events</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 }}>Check your connection and pull to refresh.</Text>
          </Card>
        )}

        {!eventsLoading && events.map(event => {
          const going = eventsGoing[event.id] || false;
          return (
            <Card key={event.id} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs }}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={[s.postTitle, { color: colors.text }]}>{event.title}</Text>
                  {event.weather && (
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 }}>
                      {event.weather.high >= 95 ? '🥵' : event.weather.high >= 85 ? '☀️' : event.weather.high >= 70 ? '🌤️' : event.weather.high >= 55 ? '🌥️' : event.weather.high >= 40 ? '🧥' : '🥶'}
                      {' '}{event.weather.high}° / {event.weather.low}°F
                    </Text>
                  )}
                </View>
                <View style={[s.badge, { backgroundColor: colors.accentLight }]}>
                  <Text style={{ color: colors.accent, fontSize: FontSize.xs }}>{event.category}</Text>
                </View>
              </View>

              <Text style={[s.postMeta, { marginBottom: Spacing.xs }]}>
                {event.date}{event.time ? ` · ${event.time}` : ''} · {event.location.name}
              </Text>

              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm }} numberOfLines={3}>
                {event.description}
              </Text>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={() => markGoing(event)}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                    borderRadius: BorderRadius.sm, borderWidth: 1,
                    backgroundColor: going ? colors.success + '22' : 'transparent',
                    borderColor: going ? colors.success : colors.border,
                  }}
                >
                  <Text style={{ color: going ? colors.success : colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm }}>
                    {going ? '✓ Going' : 'Going'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openMap(event)}
                  style={{
                    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border,
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>🗺️</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Map</Text>
                </TouchableOpacity>

                {event.url && (
                  <TouchableOpacity
                    onPress={() => openEventUrl(event.url)}
                    style={{
                      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
                      borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border,
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 14 }}>🔗</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>Details</Text>
                  </TouchableOpacity>
                )}
              </View>

              {going && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>👥</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
                    Other Ascend users may also be attending this event.
                  </Text>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    );
  };

  // ─── FORUMS VIEW ───────────────────────────────────────────────────────────
  const renderForums = () => {
    if (!sbReady) {
      return (
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <SectionHeader title="Community Forums" />
          <SetupPrompt feature="Forums" docsUrl="https://supabase.com" />
          <Card>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
              Once configured, this tab becomes a real anonymous community forum where users share experiences, ask for support, and celebrate wins.{'\n\n'}
              See the SQL setup comments in{' '}
              <Text style={{ color: colors.text, fontFamily: 'monospace' }}>src/utils/supabase.ts</Text>
              {' '}to create the required tables.
            </Text>
          </Card>
        </ScrollView>
      );
    }

    if (selectedPost) {
      // If editing the post
      if (editingPostId === selectedPost.id) {
        return (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            }}>
              <TouchableOpacity onPress={() => setEditingPostId(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md }}>Edit Post</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
              <TextInput
                style={[s.input, { marginBottom: Spacing.sm }]}
                value={editPostTitle}
                onChangeText={setEditPostTitle}
                placeholder="Title"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Edit post title input"
              />
              <TextInput
                style={[s.input, { height: 140, textAlignVertical: 'top', marginBottom: Spacing.lg }]}
                value={editPostContent}
                onChangeText={setEditPostContent}
                placeholder="Post content..."
                placeholderTextColor={colors.textSecondary}
                multiline
                accessibilityLabel="Edit post content textarea"
              />
              <Button title="Save Changes" onPress={handleEditPost} />
            </ScrollView>
          </View>
        );
      }

      return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Post header */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}>
            <TouchableOpacity onPress={() => setSelectedPost(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>Forum</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <TouchableOpacity onPress={() => toggleForumFavorite(selectedPost.id)}>
                <Text style={{ color: forumFavorites.includes(selectedPost.id) ? colors.accent : colors.textSecondary, fontSize: 18 }}>
                  {forumFavorites.includes(selectedPost.id) ? '🔖' : '📌'}
                </Text>
              </TouchableOpacity>
              {selectedPost.user_id === currentUserId ? (
                <>
                  <TouchableOpacity onPress={() => { setEditingPostId(selectedPost.id); setEditPostTitle(selectedPost.title); setEditPostContent(selectedPost.content); }}>
                    <Text style={{ color: colors.accent, fontSize: 18 }}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePost()}>
                    <Text style={{ color: colors.warning, fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => Alert.alert('Report Post', 'Are you sure you want to report this post?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Report', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thank you — our team will review it.') },
                ])}>
                  <Text style={{ color: colors.textSecondary, fontSize: 18 }}>🚩</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
            <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.sm }}>
              {selectedPost.title}
            </Text>
            <Text style={[s.postMeta, { marginBottom: Spacing.md }]}>
              {new Date(selectedPost.created_at).toLocaleDateString()} · {selectedPost.category} · {selectedPost.user_id === currentUserId ? 'You' : 'Anonymous'}
            </Text>
            <Text style={{ color: colors.text, fontSize: FontSize.md, lineHeight: 26, marginBottom: Spacing.lg }}>
              {selectedPost.content}
            </Text>
            {selectedPost.tags?.length > 0 && (
              <View style={[s.tagRow, { marginBottom: Spacing.lg }]}>
                {selectedPost.tags.map((tag, i) => (
                  <View key={i} style={s.tag}>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md, marginBottom: Spacing.sm }}>
              Comments {commentsLoading ? '' : `(${postComments.length})`}
            </Text>

            {commentsLoading && <ActivityIndicator color={colors.accent} />}

            {postComments.map(comment => (
              <View key={comment.id}>
                {editingCommentId === comment.id ? (
                  <View style={[s.commentCard, { backgroundColor: colors.accentLight, padding: Spacing.md }]}>
                    <TextInput
                      style={[s.input, { marginBottom: Spacing.sm, minHeight: 80, textAlignVertical: 'top' }]}
                      value={editCommentContent}
                      onChangeText={setEditCommentContent}
                      placeholder="Edit comment..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      accessibilityLabel="Edit comment textarea"
                    />
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <Button
                        title="Cancel"
                        variant="secondary"
                        onPress={() => setEditingCommentId(null)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Save"
                        onPress={() => handleEditComment(comment.id)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={s.commentCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ color: colors.text, fontSize: FontSize.sm, lineHeight: 20, flex: 1, marginRight: Spacing.sm }}>{comment.content}</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {comment.user_id === currentUserId ? (
                          <>
                            <TouchableOpacity onPress={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }}>
                              <Text style={{ color: colors.accent, fontSize: 14 }}>✎</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteComment(comment.id)}>
                              <Text style={{ color: colors.warning, fontSize: 14 }}>🗑️</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity onPress={() => Alert.alert('Report Comment', 'Are you sure you want to report this comment?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Report', style: 'destructive', onPress: () => Alert.alert('Reported', 'Thank you — our team will review it.') },
                          ])}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>🚩</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                      {comment.is_helpful && (
                        <Text style={{ color: colors.accent }}> · ★ Helpful</Text>
                      )}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {postComments.length === 0 && !commentsLoading && (
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, fontStyle: 'italic' }}>
                No comments yet. Be the first to respond.
              </Text>
            )}
          </ScrollView>

          {/* Comment input */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: Spacing.md, backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
            flexDirection: 'row', gap: Spacing.sm,
          }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a response..."
              placeholderTextColor={colors.textSecondary}
              multiline
              accessibilityLabel="Comment input textarea, describe your response to this post"
            />
            <TouchableOpacity
              onPress={submitComment}
              disabled={!newComment.trim() || commentPosting}
              style={{
                padding: Spacing.sm, backgroundColor: colors.accent,
                borderRadius: BorderRadius.sm, justifyContent: 'center',
                opacity: !newComment.trim() || commentPosting ? 0.5 : 1,
              }}
            >
              {commentPosting
                ? <ActivityIndicator size="small" color="#1A1A1A" />
                : <Text style={{ color: '#1A1A1A', fontSize: 16 }}>➤</Text>}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (showNewPost) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}>
            <TouchableOpacity onPress={() => setShowNewPost(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>Forum</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md }}>New Post</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.md }}>
              All posts are anonymous. Share honestly.
            </Text>
            <View style={{ marginBottom: Spacing.sm }}>
              <TextInput
                style={[s.input, { marginBottom: Spacing.xs }]}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholder="Title"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Forum post title input"
                maxLength={100}
              />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right' }}>
                {newPostTitle.length}/100
              </Text>
            </View>
            <View style={{ marginBottom: Spacing.sm }}>
              <TextInput
                style={[s.input, { height: 140, textAlignVertical: 'top', marginBottom: Spacing.xs }]}
                value={newPostBody}
                onChangeText={setNewPostBody}
                placeholder="Share your story, question, or experience..."
                placeholderTextColor={colors.textSecondary}
                multiline
                accessibilityLabel="Forum post content textarea, share your story, question, or experience"
                maxLength={500}
              />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right' }}>
                {newPostBody.length}/500
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {FORUM_CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setNewPostCategory(cat)}
                    style={{
                      paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
                      borderRadius: BorderRadius.full, borderWidth: 1,
                      backgroundColor: newPostCategory === cat ? colors.accentLight : 'transparent',
                      borderColor: newPostCategory === cat ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={{ color: newPostCategory === cat ? colors.accent : colors.textSecondary, fontSize: FontSize.xs }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput
              style={[s.input, { marginBottom: Spacing.lg }]}
              value={newPostTags}
              onChangeText={setNewPostTags}
              placeholder="Tags (comma-separated, optional)"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Forum post tags input, comma-separated optional tags"
            />
            <Button
              title={postSubmitting ? 'Posting...' : 'Post Anonymously'}
              onPress={submitNewPost}
              disabled={postSubmitting || !newPostTitle.trim() || !newPostBody.trim()}
            />
          </ScrollView>
        </View>
      );
    }

    return (
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={postsRefreshing} onRefresh={() => { setPostsRefreshing(true); loadPosts(true); }} tintColor={colors.accent} />}
      >
        {/* 5-minute time limit warning */}
        {forumTimeWarning && (
          <View style={s.warningBanner}>
            <Text style={{ color: colors.accent, fontSize: FontSize.sm, flex: 1, lineHeight: 20 }}>
              5 minutes here. Consider reaching out to someone in person instead.
            </Text>
            <TouchableOpacity onPress={() => setForumTimeWarning(false)} style={{ marginLeft: Spacing.sm }}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Featured post */}
        {featuredPost && !showFavoritesOnly && (
          <>
            <SectionHeader title="Question of the Day" />
            <TouchableOpacity onPress={() => openPost(featuredPost)} activeOpacity={0.85}>
              <Card style={{ borderColor: colors.accent, borderWidth: 1 }}>
                <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700', marginBottom: Spacing.xs }}>★ FEATURED</Text>
                <Text style={[s.postTitle, { color: colors.text }]}>{featuredPost.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }} numberOfLines={2}>
                  {featuredPost.content}
                </Text>
              </Card>
            </TouchableOpacity>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.lg }}>Forum</Text>
        </View>

        {/* Search + bookmark filter */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm, backgroundColor: colors.surface, paddingHorizontal: Spacing.sm }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: colors.text, padding: Spacing.xs, fontSize: FontSize.sm }}
              value={forumSearch}
              onChangeText={setForumSearch}
              placeholder="Search posts..."
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Search forum posts input"
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              padding: Spacing.xs, borderRadius: BorderRadius.sm, borderWidth: 1,
              borderColor: showFavoritesOnly ? colors.accent : colors.border,
              backgroundColor: showFavoritesOnly ? colors.accentLight : 'transparent',
            }}
          >
            <Text style={{ color: showFavoritesOnly ? colors.accent : colors.textSecondary, fontSize: 18 }}>🔖</Text>
          </TouchableOpacity>
        </View>

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
            {FORUM_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setForumCategory(cat)}
                style={{
                  paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
                  borderRadius: BorderRadius.full, borderWidth: 1,
                  backgroundColor: forumCategory === cat ? colors.accentLight : 'transparent',
                  borderColor: forumCategory === cat ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: forumCategory === cat ? colors.accent : colors.textSecondary, fontSize: FontSize.xs }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* No notifications note */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>🔇</Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>
            No notifications — check in intentionally, not reactively.
          </Text>
        </View>

        <Button title="+ New Post" variant="secondary" onPress={() => setShowNewPost(true)} style={{ marginBottom: Spacing.md }} />

        {postsLoading && <ActivityIndicator color={colors.accent} style={{ marginVertical: Spacing.lg }} />}

        {postsError === 'fetch_failed' && (
          <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontWeight: '600' }}>Could not load posts</Text>
            <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 }}>Pull to refresh.</Text>
          </Card>
        )}

        {!postsLoading && filteredPosts.map(post => (
          <TouchableOpacity key={post.id} onPress={() => openPost(post)} activeOpacity={0.85}>
            <Card style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={[s.postTitle, { color: colors.text, flex: 1, marginRight: Spacing.sm }]}>{post.title}</Text>
                <TouchableOpacity
                  onPress={() => toggleForumFavorite(post.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: forumFavorites.includes(post.id) ? colors.accent : colors.textSecondary, fontSize: 16 }}>🔖</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.postMeta}>
                {new Date(post.created_at).toLocaleDateString()} · {post.category}
                {post.comment_count ? ` · ${post.comment_count} comment${post.comment_count !== 1 ? 's' : ''}` : ''}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs }} numberOfLines={2}>
                {post.content}
              </Text>
              {post.tags?.length > 0 && (
                <View style={s.tagRow}>
                  {post.tags.slice(0, 3).map((tag, i) => (
                    <View key={i} style={s.tag}>
                      <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}

        {!postsLoading && filteredPosts.length === 0 && !postsError && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
            <Text style={{ color: colors.textSecondary, fontSize: 48 }}>💬</Text>
            <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
              {showFavoritesOnly ? 'No saved posts yet.' : 'No posts yet. Be the first to share.'}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── FORUMS DESKTOP FLATTENED VIEW (Three equal columns) ────────────────────
  const renderForumsDesktopFlattened = () => {
    // Left side: Posts list
    const renderPostsList = () => {
      if (!sbReady) {
        return (
          <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
            <SectionHeader title="Community Forums" />
            <SetupPrompt feature="Forums" docsUrl="https://supabase.com" />
          </ScrollView>
        );
      }

      if (showNewPost) {
        return (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            }}>
              <TouchableOpacity onPress={() => setShowNewPost(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>Forum</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md }}>New Post</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.md }}>
                All posts are anonymous. Share honestly.
              </Text>
              <View style={{ marginBottom: Spacing.sm }}>
                <TextInput
                  style={[s.input, { marginBottom: Spacing.xs }]}
                  value={newPostTitle}
                  onChangeText={setNewPostTitle}
                  placeholder="Title"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Forum post title input"
                  maxLength={100}
                />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right' }}>
                  {newPostTitle.length}/100
                </Text>
              </View>
              <View style={{ marginBottom: Spacing.sm }}>
                <TextInput
                  style={[s.input, { height: 140, textAlignVertical: 'top', marginBottom: Spacing.xs }]}
                  value={newPostBody}
                  onChangeText={setNewPostBody}
                  placeholder="Share your story, question, or experience..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  accessibilityLabel="Forum post content textarea, share your story, question, or experience"
                  maxLength={500}
                />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right' }}>
                  {newPostBody.length}/500
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {FORUM_CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewPostCategory(cat)}
                      style={{
                        paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
                        borderRadius: BorderRadius.full, borderWidth: 1,
                        backgroundColor: newPostCategory === cat ? colors.accentLight : 'transparent',
                        borderColor: newPostCategory === cat ? colors.accent : colors.border,
                      }}
                    >
                      <Text style={{ color: newPostCategory === cat ? colors.accent : colors.textSecondary, fontSize: FontSize.xs }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TextInput
                style={[s.input, { marginBottom: Spacing.lg }]}
                value={newPostTags}
                onChangeText={setNewPostTags}
                placeholder="Tags (comma-separated, optional)"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Forum post tags input, comma-separated optional tags"
              />
              <Button
                title={postSubmitting ? 'Posting...' : 'Post Anonymously'}
                onPress={submitNewPost}
                disabled={postSubmitting || !newPostTitle.trim() || !newPostBody.trim()}
              />
            </ScrollView>
          </View>
        );
      }

      return (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={postsRefreshing} onRefresh={() => { setPostsRefreshing(true); loadPosts(true); }} tintColor={colors.accent} />}
        >
          {/* Featured post */}
          {featuredPost && !showFavoritesOnly && (
            <>
              <SectionHeader title="Question of the Day" />
              <TouchableOpacity onPress={() => setSelectedPost(featuredPost)} activeOpacity={0.85}>
                <Card style={{ borderColor: colors.accent, borderWidth: 1 }}>
                  <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700', marginBottom: Spacing.xs }}>★ FEATURED</Text>
                  <Text style={[s.postTitle, { color: colors.text }]}>{featuredPost.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }} numberOfLines={2}>
                    {featuredPost.content}
                  </Text>
                </Card>
              </TouchableOpacity>
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md }}>
            <SectionHeader title="Recent Posts" />
            <TouchableOpacity
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{ marginRight: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
            >
              <Text style={{ color: colors.accent, fontSize: 18 }}>🔖</Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700' }}>
                {showFavoritesOnly ? 'All' : 'Saved'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {FORUM_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setForumCategory(cat)}
                  style={{
                    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
                    borderRadius: BorderRadius.full, borderWidth: 1,
                    backgroundColor: forumCategory === cat ? colors.accent : 'transparent',
                    borderColor: forumCategory === cat ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ color: forumCategory === cat ? '#1A1A1A' : colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {postsLoading && <ActivityIndicator size="large" color={colors.accent} />}

          {filteredPosts.map(post => (
            <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)} activeOpacity={0.85}>
              <Card style={{ marginBottom: Spacing.sm, backgroundColor: selectedPost?.id === post.id ? colors.accentLight : colors.surface }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={[s.postTitle, { color: colors.text, flex: 1, marginRight: Spacing.sm }]}>{post.title}</Text>
                  <TouchableOpacity
                    onPress={() => toggleForumFavorite(post.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 16 }}>🔖</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>
                  {new Date(post.created_at).toLocaleDateString()} · {post.category}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }} numberOfLines={2}>
                  {post.content}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
                  {post.comments_count || 0} responses
                </Text>
              </Card>
            </TouchableOpacity>
          ))}

          {!postsLoading && filteredPosts.length === 0 && !postsError && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Text style={{ color: colors.textSecondary, fontSize: 48 }}>💬</Text>
              <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                {showFavoritesOnly ? 'No saved posts yet.' : 'No posts yet. Be the first to share.'}
              </Text>
            </View>
          )}
        </ScrollView>
      );
    };

    // Right side: Post detail or empty state
    const renderPostDetail = () => {
      if (selectedPost) {
        return renderForums();
      }

      return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 64 }}>💬</Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.lg }}>
            Select a post to view
          </Text>
          <TouchableOpacity
            onPress={() => setShowNewPost(true)}
            style={{
              marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
              backgroundColor: colors.accent, borderRadius: BorderRadius.sm,
            }}
          >
            <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: FontSize.sm }}>
              Start a Discussion
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <>
        {/* Posts List (33%) */}
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: colors.border }}>
          {renderPostsList()}
        </View>

        {/* Post Detail (33%) */}
        <View style={{ flex: 1 }}>
          {renderPostDetail()}
        </View>
      </>
    );
  };

  // ─── FORUMS DESKTOP VIEW (Split Pane) ───────────────────────────────────────
  const renderForumsDesktop = () => {
    // Left side: Posts list
    const renderPostsList = () => {
      if (!sbReady) {
        return (
          <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
            <SectionHeader title="Community Forums" />
            <SetupPrompt feature="Forums" docsUrl="https://supabase.com" />
          </ScrollView>
        );
      }

      if (showNewPost) {
        return (
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            }}>
              <TouchableOpacity onPress={() => setShowNewPost(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Text style={{ color: colors.accent, fontSize: 18 }}>←</Text>
                <Text style={{ color: colors.accent, fontSize: FontSize.sm }}>Back</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md }}>New Post</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 60 }}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.md }}>
                All posts are anonymous. Share honestly.
              </Text>
              <View style={{ marginBottom: Spacing.sm }}>
                <TextInput
                  style={[s.input, { marginBottom: Spacing.xs }]}
                  value={newPostTitle}
                  onChangeText={setNewPostTitle}
                  placeholder="Title"
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel="Forum post title input"
                  maxLength={100}
                />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right' }}>
                  {newPostTitle.length}/100
                </Text>
              </View>
              <View style={{ marginBottom: Spacing.sm }}>
                <TextInput
                  style={[s.input, { height: 140, textAlignVertical: 'top', marginBottom: Spacing.xs }]}
                  value={newPostBody}
                  onChangeText={setNewPostBody}
                  placeholder="Share your story, question, or experience..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  accessibilityLabel="Forum post content textarea, share your story, question, or experience"
                  maxLength={500}
                />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, textAlign: 'right' }}>
                  {newPostBody.length}/500
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                  {FORUM_CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setNewPostCategory(cat)}
                      style={{
                        paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
                        borderRadius: BorderRadius.full, borderWidth: 1,
                        backgroundColor: newPostCategory === cat ? colors.accentLight : 'transparent',
                        borderColor: newPostCategory === cat ? colors.accent : colors.border,
                      }}
                    >
                      <Text style={{ color: newPostCategory === cat ? colors.accent : colors.textSecondary, fontSize: FontSize.xs }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TextInput
                style={[s.input, { marginBottom: Spacing.lg }]}
                value={newPostTags}
                onChangeText={setNewPostTags}
                placeholder="Tags (comma-separated, optional)"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Forum post tags input, comma-separated optional tags"
              />
              <Button
                title={postSubmitting ? 'Posting...' : 'Post Anonymously'}
                onPress={submitNewPost}
                disabled={postSubmitting || !newPostTitle.trim() || !newPostBody.trim()}
              />
            </ScrollView>
          </View>
        );
      }

      return (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={postsRefreshing} onRefresh={() => { setPostsRefreshing(true); loadPosts(true); }} tintColor={colors.accent} />}
        >
          {/* Featured post */}
          {featuredPost && !showFavoritesOnly && (
            <>
              <SectionHeader title="Question of the Day" />
              <TouchableOpacity onPress={() => setSelectedPost(featuredPost)} activeOpacity={0.85}>
                <Card style={{ borderColor: colors.accent, borderWidth: 1 }}>
                  <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700', marginBottom: Spacing.xs }}>★ FEATURED</Text>
                  <Text style={[s.postTitle, { color: colors.text }]}>{featuredPost.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }} numberOfLines={2}>
                    {featuredPost.content}
                  </Text>
                </Card>
              </TouchableOpacity>
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md }}>
            <SectionHeader title="Recent Posts" />
            <TouchableOpacity
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{ marginRight: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
            >
              <Text style={{ color: colors.accent, fontSize: 18 }}>🔖</Text>
              <Text style={{ color: colors.accent, fontSize: FontSize.xs, fontWeight: '700' }}>
                {showFavoritesOnly ? 'All' : 'Saved'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
              {FORUM_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setForumCategory(cat)}
                  style={{
                    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
                    borderRadius: BorderRadius.full, borderWidth: 1,
                    backgroundColor: forumCategory === cat ? colors.accent : 'transparent',
                    borderColor: forumCategory === cat ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ color: forumCategory === cat ? '#1A1A1A' : colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {postsLoading && <ActivityIndicator size="large" color={colors.accent} />}

          {filteredPosts.map(post => (
            <TouchableOpacity key={post.id} onPress={() => setSelectedPost(post)} activeOpacity={0.85}>
              <Card style={{ marginBottom: Spacing.sm, backgroundColor: selectedPost?.id === post.id ? colors.accentLight : colors.surface }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={[s.postTitle, { color: colors.text, flex: 1, marginRight: Spacing.sm }]}>{post.title}</Text>
                  <TouchableOpacity
                    onPress={() => toggleForumFavorite(post.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 16 }}>🔖</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginBottom: Spacing.xs }}>
                  {new Date(post.created_at).toLocaleDateString()} · {post.category}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }} numberOfLines={2}>
                  {post.content}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
                  {post.comments_count || 0} responses
                </Text>
              </Card>
            </TouchableOpacity>
          ))}

          {!postsLoading && filteredPosts.length === 0 && !postsError && (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Text style={{ color: colors.textSecondary, fontSize: 48 }}>💬</Text>
              <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                {showFavoritesOnly ? 'No saved posts yet.' : 'No posts yet. Be the first to share.'}
              </Text>
            </View>
          )}
        </ScrollView>
      );
    };

    // Right side: Post detail or empty state
    const renderPostDetail = () => {
      if (selectedPost) {
        return renderForums();
      }

      return (
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontSize: 64 }}>💬</Text>
          <Text style={{ color: colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.lg }}>
            Select a post to view
          </Text>
          <TouchableOpacity
            onPress={() => setShowNewPost(true)}
            style={{
              marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
              backgroundColor: colors.accent, borderRadius: BorderRadius.sm,
            }}
          >
            <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: FontSize.sm }}>
              Start a Discussion
            </Text>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Posts List - Left side (50%) */}
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: colors.border }}>
          {renderPostsList()}
        </View>

        {/* Post Detail - Right side (50%) */}
        <View style={{ flex: 1 }}>
          {renderPostDetail()}
        </View>
      </View>
    );
  };

  if (desktop) {
    // Desktop: Split pane layout with Events (33%), Forums Posts (33%), Forum Detail (33%)
    return (
      <View style={[s.container, { flexDirection: 'row' }]}>
        {/* Events Panel (33%) */}
        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: colors.border }}>
          {renderEvents()}
        </View>

        {/* Forums Panel (two-column split) */}
        {renderForumsDesktopFlattened()}
      </View>
    );
  }

  // Mobile: Tab-based layout
  return (
    <View style={s.container}>
      {/* Tab bar — only show when not in post detail / new post view */}
      {!selectedPost && !showNewPost && (
        <View style={s.tabRow}>
          {(['events', 'forums'] as CommunityTab[]).map(tab => (
            <TouchableOpacity key={tab} style={s.tab} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, { color: activeTab === tab ? colors.accent : colors.textSecondary }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={{ height: 2, width: 30, backgroundColor: colors.accent, marginTop: 4, borderRadius: 1 }} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeTab === 'events' ? renderEvents() : renderForums()}
    </View>
  );
}
