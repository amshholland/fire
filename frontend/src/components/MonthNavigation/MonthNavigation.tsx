import React from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { getMonthName } from '../../utils/dateUtils'
import './MonthNavigation.css'

interface MonthNavigationProps {
  month: number
  year: number
  onPreviousMonth: () => void
  onNextMonth: () => void
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
  month,
  year,
  onPreviousMonth,
  onNextMonth
}) => {
  return (
    <div className="month-navigation">
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={onPreviousMonth}
        aria-label="Previous month"
      />
      <span className="month-display">
        {getMonthName(month)} {year}
      </span>
      <Button
        type="text"
        icon={<RightOutlined />}
        onClick={onNextMonth}
        aria-label="Next month"
      />
    </div>
  )
}

export default MonthNavigation
