import { Calendar } from "@repo/design-system/components/ui/calendar";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { addDays } from "date-fns";
import { action } from "storybook/actions";

// Date offset constants for demo purposes
const DAYS_2 = 2;
const DAYS_3 = 3;
const DAYS_5 = 5;
const DAYS_7 = 7;
const DAYS_8 = 8;

/**
 * A date field component that allows users to enter and edit date.
 */
const meta = {
  title: "ui/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    mode: "single",
    selected: new Date(),
    onSelect: action("onDayClick"),
    className: "rounded-md border w-fit",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the calendar.
 */
export const Default: Story = {};

/**
 * Use the `multiple` mode to select multiple dates.
 */
export const Multiple: Story = {
  args: {
    min: 1,
    selected: [
      new Date(),
      addDays(new Date(), DAYS_2),
      addDays(new Date(), DAYS_8),
    ],
    mode: "multiple",
  },
};

/**
 * Use the `range` mode to select a range of dates.
 */
export const Range: Story = {
  args: {
    selected: {
      from: new Date(),
      to: addDays(new Date(), DAYS_7),
    },
    mode: "range",
  },
};

/**
 * Use the `disabled` prop to disable specific dates.
 */
export const Disabled: Story = {
  args: {
    disabled: [
      addDays(new Date(), 1),
      addDays(new Date(), DAYS_2),
      addDays(new Date(), DAYS_3),
      addDays(new Date(), DAYS_5),
    ],
  },
};

/**
 * Use the `numberOfMonths` prop to display multiple months.
 */
export const MultipleMonths: Story = {
  args: {
    numberOfMonths: 2,
    showOutsideDays: false,
  },
};
