# Requirements Document

## Introduction

A minimal expense tracker web app built with HTML, CSS, and vanilla JavaScript. The app runs entirely in the browser with no backend. Users can log expenses, view a transaction list, see their total balance, and visualize spending by category via a pie chart.

## Glossary

- **App**: The expense tracker single-page web application
- **Transaction**: A single expense record consisting of a name, amount, and category
- **Category**: A predefined label used to classify a Transaction — one of: Food, Transport, or Fun
- **Transaction_List**: The scrollable list displaying all recorded Transactions
- **Total_Balance**: The running sum of all Transaction amounts displayed at the top of the App
- **Pie_Chart**: A chart showing the spending distribution across Categories
- **User**: The individual interacting with the App to log and manage personal expenses
- **LocalStorage**: The browser's built-in Storage API used to persist all Transactions and budget data locally, ensuring data survives page refreshes
- **Validation**: The logic that prevents saving if the item name is empty, the amount is not a positive number, or the Category is unselected
- **CDN (Content Delivery Network)**: The external link used to load the Chart.js library without local installation

## Requirements

### Requirement 1: Input Form

**User Story:** As a User, I want to enter an expense with a name, amount, and category, so that I can track where my money is going.

#### Acceptance Criteria

1. THE App SHALL provide an input form containing a text field for the item name, a numeric field for the amount, and a dropdown for the Category.
2. THE App SHALL populate the Category dropdown with exactly three options: Food, Transport, and Fun.
3. WHEN the User submits the form with a valid item name, a positive numeric amount, and a selected Category, THE App SHALL add the Transaction to the Transaction_List.
4. WHEN a Transaction is successfully added, THE App SHALL clear all form fields.
5. IF the User submits the form with an empty item name, THEN THE App SHALL display a Validation error and SHALL NOT add the Transaction.
6. IF the User submits the form with a non-positive or non-numeric amount, THEN THE App SHALL display a Validation error and SHALL NOT add the Transaction.
7. IF the User submits the form without selecting a Category, THEN THE App SHALL display a Validation error and SHALL NOT add the Transaction.

### Requirement 2: Transaction List

**User Story:** As a User, I want to see a scrollable list of all my transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE App SHALL display a Transaction_List showing all Transactions that have been added.
2. THE App SHALL render each Transaction entry with its item name, amount, and Category.
3. THE App SHALL render a delete control alongside each Transaction entry.
4. WHEN the User activates the delete control for a Transaction, THE App SHALL display a window.confirm dialog asking the User to confirm the deletion.
5. WHEN the User confirms the deletion, THE App SHALL remove that Transaction from the Transaction_List immediately without requiring a page reload.
6. IF the User cancels the deletion dialog, THEN THE App SHALL leave the Transaction unchanged in the Transaction_List.
7. WHEN no Transactions exist, THE App SHALL display an empty-state message in place of the Transaction_List.

### Requirement 3: Total Balance

**User Story:** As a User, I want to see my total balance at the top of the page, so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the Total_Balance at the top of the page.
2. WHEN a Transaction is added, THE App SHALL immediately update the Total_Balance to reflect the new sum.
3. WHEN a Transaction is deleted, THE App SHALL immediately update the Total_Balance to reflect the new sum.

### Requirement 4: Visual Chart

**User Story:** As a User, I want to see a pie chart of my spending by category, so that I can understand my spending distribution at a glance.

#### Acceptance Criteria

1. THE App SHALL render a Pie_Chart showing the spending distribution across the three Categories: Food, Transport, and Fun.
2. WHERE Chart.js is used as the charting library, THE App SHALL load it via a CDN script tag.
3. WHEN a Transaction is added, THE App SHALL immediately update the Pie_Chart to reflect the current Category distribution.
4. WHEN a Transaction is deleted, THE App SHALL immediately update the Pie_Chart to reflect the current Category distribution.
5. WHEN no Transactions exist, THE App SHALL display an empty-state placeholder in place of the Pie_Chart.

### Requirement 5: Data Persistence

**User Story:** As a User, I want my transactions to be saved between sessions, so that my expense history is not lost when I refresh or close the page.

#### Acceptance Criteria

1. WHEN the App initialises, THE App SHALL load all previously saved Transactions from LocalStorage using localStorage.getItem and JSON.parse.
2. WHEN a Transaction is added, THE App SHALL immediately persist the updated Transaction list to LocalStorage using JSON.stringify and localStorage.setItem.
3. WHEN a Transaction is deleted, THE App SHALL immediately persist the updated Transaction list to LocalStorage using JSON.stringify and localStorage.setItem.
4. WHILE Transactions are stored in LocalStorage, THE App SHALL restore the Transaction_List, Total_Balance, and Pie_Chart to their last saved state on page load.
5. IF LocalStorage contains no saved data, THEN THE App SHALL initialise with an empty Transaction_List.
