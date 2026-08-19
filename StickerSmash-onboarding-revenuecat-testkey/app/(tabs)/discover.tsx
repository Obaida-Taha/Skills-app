import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Button, Card, Input, Screen } from '@/components/UI';
import { useApp } from '@/contexts/AppContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FREE_SKILL_LIMIT } from '@/features/premium/config';
import { fetchCatalogSkills } from '@/lib/catalog';
import { CatalogSkill } from '@/types';

type DiscoverLevel =
  | 'categories'
  | 'subcategories'
  | 'skills'
  | 'details';

export default function Discover() {
  const { addSkill, skills } = useApp();
  const { isPremium, presentPaywall } = useSubscription();

  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [level, setLevel] = useState<DiscoverLevel>('categories');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );

  const [selectedSubCategory, setSelectedSubCategory] = useState<
    string | null
  >(null);

  const [selectedSkill, setSelectedSkill] =
    useState<CatalogSkill | null>(null);

  const [search, setSearch] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  const loadSkills = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const rows = await fetchCatalogSkills();

      setCatalog(rows);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not load skills.';

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(catalog.map((skill) => skill.category))
    ).sort();
  }, [catalog]);

  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];

    return Array.from(
      new Set(
        catalog
          .filter(
            (skill) => skill.category === selectedCategory
          )
          .map((skill) => skill.subCategory)
      )
    ).sort();
  }, [catalog, selectedCategory]);

  const categorySkills = useMemo(() => {
    if (!selectedCategory || !selectedSubCategory) {
      return [];
    }

    return catalog.filter(
      (skill) =>
        skill.category === selectedCategory &&
        skill.subCategory === selectedSubCategory
    );
  }, [
    catalog,
    selectedCategory,
    selectedSubCategory,
  ]);

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categorySkills;

    return categorySkills.filter((skill) =>
      [
        skill.name,
        skill.description,
        skill.difficulty,
        skill.estimatedHours,
      ].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [categorySkills, search]);

  const isLearning = (skill: CatalogSkill) =>
    skills.some((item) => item.id === skill.id);

  function goToCategories() {
    setLevel('categories');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedSkill(null);
    setSearch('');
  }

  function goToCategory(category: string) {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setSelectedSkill(null);
    setSearch('');
    setLevel('subcategories');
  }

  function goToSubCategory(subCategory: string) {
    setSelectedSubCategory(subCategory);
    setSelectedSkill(null);
    setSearch('');
    setLevel('skills');
  }

  function goToSkill(skill: CatalogSkill) {
    setSelectedSkill(skill);
    setLevel('details');
  }

  function goBack() {
    if (level === 'details') {
      setSelectedSkill(null);
      setLevel('skills');
      return;
    }

    if (level === 'skills') {
      setSelectedSubCategory(null);
      setSearch('');
      setLevel('subcategories');
      return;
    }

    if (level === 'subcategories') {
      goToCategories();
    }
  }

  async function handleAddSelectedSkill() {
    if (!selectedSkill || isLearning(selectedSkill) || addingSkill) {
      return;
    }

    try {
      setAddingSkill(true);

      if (!isPremium && skills.length >= FREE_SKILL_LIMIT) {
        const unlocked = await presentPaywall();
        if (!unlocked) return;
      }

      await addSkill(selectedSkill);

      Alert.alert(
        'Skill added',
        `${selectedSkill.name} was added to My Skills.`
      );
    } catch (error) {
      console.warn('Could not add skill:', error);
      Alert.alert('Could not add skill', 'Please try again.');
    } finally {
      setAddingSkill(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <AppText muted>
            Loading skills...
          </AppText>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.wrap}>
          <AppText style={styles.title}>
            Discover
          </AppText>

          <Card style={styles.stateCard}>
            <AppText style={styles.heading}>
              Couldn't load skills
            </AppText>

            <AppText muted>{error}</AppText>

            <Button
              title="Try again"
              onPress={() => loadSkills()}
            />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.wrap}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSkills(true)}
          />
        }
      >
        <AppText style={styles.title}>
          Discover
        </AppText>

        {level !== 'categories' && (
          <Pressable onPress={goBack}>
            <AppText style={styles.backButton}>
              ‹ Back
            </AppText>
          </Pressable>
        )}

        <View style={styles.breadcrumb}>
          <Pressable onPress={goToCategories}>
            <AppText style={styles.breadcrumbLink}>
              Categories
            </AppText>
          </Pressable>

          {selectedCategory && (
            <>
              <AppText muted>›</AppText>

              <Pressable
                onPress={() =>
                  goToCategory(selectedCategory)
                }
              >
                <AppText style={styles.breadcrumbLink}>
                  {selectedCategory}
                </AppText>
              </Pressable>
            </>
          )}

          {selectedSubCategory && (
            <>
              <AppText muted>›</AppText>

              <Pressable
                onPress={() =>
                  goToSubCategory(selectedSubCategory)
                }
              >
                <AppText style={styles.breadcrumbLink}>
                  {selectedSubCategory}
                </AppText>
              </Pressable>
            </>
          )}

          {selectedSkill && (
            <>
              <AppText muted>›</AppText>

              <AppText style={styles.breadcrumbCurrent}>
                {selectedSkill.name}
              </AppText>
            </>
          )}
        </View>

        {level === 'categories' && (
          <>
            <AppText muted>
              Choose a category.
            </AppText>

            <View style={styles.list}>
              {categories.map((category) => {
                const count = catalog.filter(
                  (skill) => skill.category === category
                ).length;

                return (
                  <Pressable
                    key={category}
                    onPress={() =>
                      goToCategory(category)
                    }
                  >
                    <Card style={styles.rowCard}>
                      <View style={{ flex: 1 }}>
                        <AppText style={styles.rowTitle}>
                          {category}
                        </AppText>

                        <AppText muted>
                          {count} skills
                        </AppText>
                      </View>

                      <AppText style={styles.chevron}>
                        ›
                      </AppText>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {level === 'subcategories' &&
          selectedCategory && (
            <>
              <AppText style={styles.heading}>
                {selectedCategory}
              </AppText>

              <AppText muted>
                Choose a subcategory.
              </AppText>

              <View style={styles.list}>
                {subCategories.map(
                  (subCategory) => {
                    const count = catalog.filter(
                      (skill) =>
                        skill.category ===
                          selectedCategory &&
                        skill.subCategory ===
                          subCategory
                    ).length;

                    return (
                      <Pressable
                        key={subCategory}
                        onPress={() =>
                          goToSubCategory(subCategory)
                        }
                      >
                        <Card style={styles.rowCard}>
                          <View style={{ flex: 1 }}>
                            <AppText
                              style={styles.rowTitle}
                            >
                              {subCategory}
                            </AppText>

                            <AppText muted>
                              {count} skills
                            </AppText>
                          </View>

                          <AppText
                            style={styles.chevron}
                          >
                            ›
                          </AppText>
                        </Card>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </>
          )}

        {level === 'skills' &&
          selectedCategory &&
          selectedSubCategory && (
            <>
              <AppText style={styles.heading}>
                {selectedSubCategory}
              </AppText>

              <AppText muted>
                Choose a skill.
              </AppText>

              <Input
                placeholder="Search skills..."
                value={search}
                onChangeText={setSearch}
              />

              <View style={styles.list}>
                {filteredSkills.map((skill) => (
                  <Pressable
                    key={skill.id}
                    onPress={() => goToSkill(skill)}
                  >
                    <Card style={styles.rowCard}>
                      <View style={{ flex: 1 }}>
                        <View
                          style={styles.skillTitleRow}
                        >
                          <AppText
                            style={styles.rowTitle}
                          >
                            {skill.name}
                          </AppText>

                          {isLearning(skill) && (
                            <View
                              style={
                                styles.learningBadge
                              }
                            >
                              <AppText
                                style={
                                  styles.learningText
                                }
                              >
                                Learning
                              </AppText>
                            </View>
                          )}
                        </View>

                        <AppText muted>
                          {skill.difficulty} ·{' '}
                          {skill.estimatedHours}
                        </AppText>
                      </View>

                      <AppText style={styles.chevron}>
                        ›
                      </AppText>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </>
          )}

        {level === 'details' &&
          selectedSkill && (
            <View style={styles.details}>
              <AppText style={styles.detailTitle}>
                {selectedSkill.name}
              </AppText>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <AppText style={styles.metaText}>
                    {selectedSkill.difficulty}
                  </AppText>
                </View>

                <View style={styles.metaPill}>
                  <AppText style={styles.metaText}>
                    {selectedSkill.estimatedHours}
                  </AppText>
                </View>
              </View>

              <Card style={styles.descriptionCard}>
                <AppText>
                  {selectedSkill.description}
                </AppText>
              </Card>

              <Button
                title={
                  isLearning(selectedSkill)
                    ? 'Already in My Skills'
                    : addingSkill
                    ? 'Please wait…'
                    : !isPremium && skills.length >= FREE_SKILL_LIMIT
                    ? 'Unlock Premium to add more'
                    : 'Add to My Skills'
                }
                disabled={isLearning(selectedSkill) || addingSkill}
                onPress={() => void handleAddSelectedSkill()}
              />
            </View>
          )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 22,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 14,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  title: {
    fontSize: 29,
    fontWeight: '900',
  },

  heading: {
    fontSize: 22,
    fontWeight: '900',
  },

  backButton: {
    fontSize: 16,
    fontWeight: '800',
  },

  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },

  breadcrumbLink: {
    fontSize: 13,
    fontWeight: '800',
  },

  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '900',
  },

  list: {
    gap: 10,
  },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: '900',
  },

  chevron: {
    fontSize: 28,
    opacity: 0.45,
  },

  skillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  learningBadge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  learningText: {
    fontSize: 11,
    fontWeight: '900',
  },

  details: {
    gap: 16,
  },

  detailTitle: {
    fontSize: 25,
    fontWeight: '900',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },

  metaPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  metaText: {
    fontSize: 12,
    fontWeight: '800',
  },

  descriptionCard: {
    gap: 8,
  },

  stateCard: {
    gap: 12,
  },
});