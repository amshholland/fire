/**
 * Budget Setup Page
 *
 * Simple interface for assigning planned amounts to categories.
 * Allows users to create or update monthly budgets.
 *
 * Features:
 * - Category list with amount inputs
 * - Month/year selector
 * - Running total of planned amounts
 * - Save button
 * - No spending data displayed
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Input,
  Button,
  Spin,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  Dropdown,
  Modal
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  EditOutlined
} from '@ant-design/icons';
import {
  BudgetSetupRequest,
  BudgetSetupItem
} from '../../types/budget-setup.types';
import { useUserAuth } from '../../hooks/useUserAuth';
import { getMonthName } from '../../utils/dateUtils';
import MonthNavigation from '../../components/MonthNavigation/MonthNavigation';
import './BudgetSetupPage.css';

const { Title, Text } = Typography;

interface Category {
  id: number;
  name: string;
  description: string | null;
}

const BudgetSetupPage: React.FC = () => {
  const { user } = useUserAuth();
  const userId = user?.sub || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetAmounts, setBudgetAmounts] = useState<Record<number, number>>(
    {}
  );
  const [savedBudgetAmounts, setSavedBudgetAmounts] = useState<
    Record<number, number>
  >({});
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [newCategories, setNewCategories] = useState<
    Array<{ name: string; amount: string }>
  >([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );
  const [editingCategoryName, setEditingCategoryName] = useState<string>('');
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  // Fetch categories and budgets on mount and when month/year changes
  useEffect(() => {
    if (userId) {
      const loadData = async () => {
        try {
          setLoading(true);
          await fetchCategories();
          await fetchBudgets();
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [userId, selectedMonth, selectedYear]);

  const fetchCategories = async () => {
    try {
      // First fetch all available categories
      const response = await fetch(`/api/categories?user_id=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      let allCategories = data.categories || [];

      // Try to get Plaid categories from transactions to prioritize in display
      try {
        const plaidResponse = await fetch(
          `/api/categories/plaid?user_id=${userId}`
        );
        if (plaidResponse.ok) {
          const plaidData = await plaidResponse.json();
          const plaidCategories = plaidData.categories || [];
          console.log(
            '📊 Fetched Plaid categories from transactions:',
            plaidCategories
          );

          // Filter categories to show only those with Plaid transactions
          // This way, budget setup is focused on actual spending
          if (plaidCategories.length > 0) {
            const plaidCategoryNames = new Set(plaidCategories);
            allCategories = allCategories.filter((cat: Category) =>
              plaidCategoryNames.has(cat.name)
            );
            console.log(
              '📋 Filtered categories to Plaid spending:',
              allCategories
            );
          }
        }
      } catch (error) {
        console.log(
          'ℹ️ No Plaid categories found yet, showing all available categories'
        );
        // If Plaid categories aren't available yet, just show all categories
      }

      setCategories(allCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await fetch(
        `/api/budgets?userId=${userId}&month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '❌ Budgets API error - Status:',
          response.status,
          'Error:',
          errorData
        );
        throw new Error(`Failed to fetch budgets: ${response.status}`);
      }

      const data = await response.json();
      const categoryBudgets = data.categoryBudgets || [];
      console.log('📥 Fetched budgets from backend:', categoryBudgets);

      // Pre-populate budgetAmounts from fetched budgets
      const amounts: Record<number, number> = {};
      categoryBudgets.forEach(
        (budget: { category_id: number; budgeted_amount: number }) => {
          amounts[budget.category_id] = budget.budgeted_amount;
        }
      );
      console.log('💾 Setting budgetAmounts to:', amounts);
      setBudgetAmounts(amounts);
      setSavedBudgetAmounts(amounts);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      // Don't show error for missing budgets - it's normal for new months
      setBudgetAmounts({});
    }
  };

  // Calculate total planned amount
  const totalPlanned = useMemo(() => {
    const existingTotal = Object.values(budgetAmounts).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    );
    const newTotal = newCategories.reduce(
      (sum, cat) => sum + (parseFloat(cat.amount) || 0),
      0
    );
    return existingTotal + newTotal;
  }, [budgetAmounts, newCategories]);

  // Check if budgets have been modified since last save
  const hasUnsavedChanges = useMemo(() => {
    // Check existing categories
    const currentKeys = Object.keys(budgetAmounts).map(Number);
    const savedKeys = Object.keys(savedBudgetAmounts).map(Number);

    if (currentKeys.length !== savedKeys.length) {
      return true;
    }

    const existingChanged = currentKeys.some(
      (key) => (budgetAmounts[key] || 0) !== (savedBudgetAmounts[key] || 0)
    );

    // Check if there are new categories to add
    const hasNewCategories = newCategories.some(
      (cat) => cat.name.trim() && cat.amount
    );

    return existingChanged || hasNewCategories;
  }, [budgetAmounts, savedBudgetAmounts, newCategories]);

  // Handle amount input change
  const handleAmountChange = (categoryId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBudgetAmounts((prev) => ({
      ...prev,
      [categoryId]: numValue
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      // First, handle category editing if in edit mode
      if (editingCategoryId !== null) {
        if (!editingCategoryName.trim()) {
          message.error('Please enter a category name');
          return;
        }

        // Update category name in database
        const updateResponse = await fetch(
          `/api/categories/${editingCategoryId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              name: editingCategoryName.trim()
            })
          }
        );

        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          throw new Error(error.error || 'Failed to update category');
        }

        // Update local state
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategoryId
              ? { ...cat, name: editingCategoryName.trim() }
              : cat
          )
        );

        message.success('Category updated successfully');
        setEditingCategoryId(null);
        setEditingCategoryName('');
      }

      // First, create any new categories
      const createdCategories: Category[] = [];
      for (const newCat of newCategories) {
        if (!newCat.name.trim()) {
          message.error('Please enter names for all new categories');
          return;
        }
        if (!newCat.amount || parseFloat(newCat.amount) <= 0) {
          message.error('Please enter valid amounts for all new categories');
          return;
        }

        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            name: newCat.name.trim(),
            description: null
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create category');
        }

        const result = await response.json();
        createdCategories.push(result.category);
      }

      // Add created categories to the list
      if (createdCategories.length > 0) {
        setCategories((prev) => [...prev, ...createdCategories]);
      }

      // Build budget items from entered amounts (existing + new categories)
      const budgetItems: BudgetSetupItem[] = [
        ...categories.map((cat) => ({
          category_id: cat.id,
          category_name: cat.name,
          planned_amount: budgetAmounts[cat.id] || 0
        })),
        ...createdCategories.map((cat, index) => ({
          category_id: cat.id,
          category_name: cat.name,
          planned_amount: parseFloat(newCategories[index]?.amount || '0')
        }))
      ].filter((item) => item.planned_amount > 0);

      if (budgetItems.length === 0) {
        message.warning('Please enter at least one budget amount');
        return;
      }

      const requestBody: BudgetSetupRequest = {
        user_id: userId,
        month: selectedMonth,
        year: selectedYear,
        budgets: budgetItems
      };

      const response = await fetch('/api/budgets/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save budget');
      }

      const result = await response.json();
      message.success(
        `Successfully saved ${result.count} budget(s) for ${getMonthName(selectedMonth)} ${selectedYear}. Switch to the Budget page to see the updated budgets.`
      );

      // Clear new categories and update saved state
      setNewCategories([]);
      setSavedBudgetAmounts(budgetAmounts);

      // Refresh budgets to reflect changes
      await fetchBudgets();
    } catch (error) {
      console.error('Error saving budget:', error);
      message.error(
        error instanceof Error ? error.message : 'Failed to save budget'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (loading) {
    return (
      <div className="budget-setup-loading">
        <Spin size="large" />
      </div>
    );
  }

  const handleAddNewCategoryRow = () => {
    setNewCategories((prev) => [...prev, { name: '', amount: '' }]);
  };

  const handleNewCategoryChange = (
    index: number,
    field: 'name' | 'amount',
    value: string
  ) => {
    setNewCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleRemoveNewCategory = (index: number) => {
    setNewCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setSaving(true);

      // Delete the budget for this category and month
      const response = await fetch(
        `/api/budgets?userId=${userId}&month=${selectedMonth}&year=${selectedYear}&categoryId=${categoryToDelete.id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete budget');
      }

      message.success(
        `Budget for "${categoryToDelete.name}" removed for ${getMonthName(selectedMonth)} ${selectedYear}`
      );

      // Remove from local state
      setBudgetAmounts((prev) => {
        const newAmounts = { ...prev };
        delete newAmounts[categoryToDelete.id];
        return newAmounts;
      });
      setSavedBudgetAmounts((prev) => {
        const newAmounts = { ...prev };
        delete newAmounts[categoryToDelete.id];
        return newAmounts;
      });

      // Refresh budgets to reflect changes
      await fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      message.error(
        error instanceof Error ? error.message : 'Failed to delete budget'
      );
    } finally {
      setSaving(false);
      setDeleteModalVisible(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setCategoryToDelete(null);
  };
  return (
    <div className="budget-setup-page">
      <Card className="budget-setup-card">
        <Title level={2}>Setup Monthly Budget</Title>
        <Text type="secondary">
          Assign planned amounts to each category for your budget
        </Text>

        <Divider />

        {/* Month and Year Navigation */}
        <div className="month-navigation-section">
          <MonthNavigation
            month={selectedMonth}
            year={selectedYear}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        <Divider />

        {/* Category List with Amount Inputs */}
        <div className="budget-setup-categories">
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Col>
              <Title level={4}>Category Budgets</Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNewCategoryRow}
                size="small"
              >
                Add Category
              </Button>
            </Col>
          </Row>
          <div className="category-list">
            {categories.map((category) => {
              const isEditing = editingCategoryId === category.id;

              return (
                <Row
                  key={category.id}
                  className="category-row"
                  gutter={16}
                  align="middle"
                >
                  <Col span={isEditing ? 9 : 11}>
                    {isEditing ? (
                      <Input
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        size="large"
                      />
                    ) : (
                      <>
                        <Text strong>{category.name}</Text>
                        {category.description && (
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {category.description}
                            </Text>
                          </div>
                        )}
                      </>
                    )}
                  </Col>
                  <Col span={isEditing ? 9 : 11}>
                    <Input
                      prefix="$"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={
                        category.id in savedBudgetAmounts &&
                        savedBudgetAmounts[category.id]! > 0
                          ? `${savedBudgetAmounts[category.id]!.toFixed(2)}`
                          : '0.00'
                      }
                      value={
                        budgetAmounts[category.id] !== undefined
                          ? budgetAmounts[category.id]!.toFixed(2)
                          : ''
                      }
                      onChange={(e) =>
                        handleAmountChange(category.id, e.target.value)
                      }
                      size="large"
                      className="amount-input"
                      disabled={isEditing && false} // Allow editing amount even in edit mode
                    />
                  </Col>
                  <Col span={4}>
                    {isEditing ? (
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </Space>
                    ) : (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'edit',
                              icon: <EditOutlined />,
                              label: 'Edit',
                              onClick: () => handleEditCategory(category),
                              disabled: isEditing
                            },
                            {
                              key: 'delete',
                              icon: <DeleteOutlined />,
                              label: 'Delete',
                              danger: true,
                              onClick: () => handleDeleteCategory(category)
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          size="large"
                        />
                      </Dropdown>
                    )}
                  </Col>
                </Row>
              );
            })}
            {newCategories.map((newCat, index) => (
              <Row
                key={`new-${index}`}
                className="category-row"
                gutter={16}
                align="middle"
              >
                <Col span={10}>
                  <Input
                    placeholder="Category name"
                    value={newCat.name}
                    onChange={(e) =>
                      handleNewCategoryChange(index, 'name', e.target.value)
                    }
                    size="large"
                  />
                </Col>
                <Col span={10}>
                  <Input
                    prefix="$"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={newCat.amount}
                    onChange={(e) =>
                      handleNewCategoryChange(index, 'amount', e.target.value)
                    }
                    size="large"
                  />
                </Col>
                <Col span={4}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveNewCategory(index)}
                    size="large"
                  />
                </Col>
              </Row>
            ))}
            {categories.length === 0 && newCategories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">
                  No categories yet. Click "Add Category" to get started.
                </Text>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Total and Save Button */}
        <Row
          justify="space-between"
          align="middle"
          className="budget-setup-footer"
        >
          <Col>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Estimated Monthly Total</Text>
              <Title level={3} style={{ margin: 0 }}>
                ${totalPlanned.toFixed(2)}
              </Title>
              {totalPlanned === 0 && categories.length > 0 && (
                <Text type="warning" style={{ fontSize: '12px', marginTop: 8 }}>
                  Enter amounts above to enable saving
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              Save Budget
            </Button>
          </Col>
        </Row>
      </Card>

      <Modal
        title="Remove Budget Category"
        open={deleteModalVisible}
        onCancel={handleCancelDelete}
        footer={[
          <Button key="cancel" onClick={handleCancelDelete}>
            Cancel
          </Button>,
          <Button
            key="remove"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            loading={saving}
          >
            Remove
          </Button>
        ]}
      >
        <p>
          Remove budget category for this month?
          <br />
          <Text type="secondary">
            This will remove the budget for "{categoryToDelete?.name}" for{' '}
            {getMonthName(selectedMonth)} {selectedYear}.
          </Text>
        </p>
      </Modal>
    </div>
  );
};

export default BudgetSetupPage
