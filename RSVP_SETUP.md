# RSVP Setup

The website now uses the Google Sheet as the private source of truth for guest
login, household access, and RSVP status.

## Local Preview

The local folder contains an ignored `local-guest-data.js` generated from the
workbook. This makes the real guest logins work when previewing the site on
`localhost` or by opening `index.html` directly.

Local preview RSVPs are stored only in that browser's `localStorage`. They are
for testing and do not write to the Google Sheet.

## 1. Prepare the Google Sheet

Open the Google Sheet currently attached to the RSVP Apps Script.

Import these two tabs from `wedding_website_guest_master_final.xlsx`:

- `Login_Master`
- `Household_Master`

Keep the tab names and header rows exactly as written. The website derives:

- Named household members from `Login_Master`
- Total invited seats and event access from `Household_Master`
- Login access only from rows where `can_rsvp_for_household` is blank or `TRUE`
- Unnamed adult capacity from total invited seats minus named household members
  and remaining unnamed child slots
- Child capacity from `children_count`, reduced by any named child rows already
  shown in the household member list

To name a spouse or child without creating a separate login, add them to
`Login_Master` with the same `household_id`, a unique `guest_id`, and
`can_rsvp_for_household` set to `FALSE`. Use `login_role` values like
`named_partner` or `named_child`. Named children appear in the household RSVP
list and require an age only when marked as attending.

Do not increase `total_guests` for these rows. Naming a spouse or child only
moves that person from an unnamed slot into the named household list.

The source workbook is not modified.

The script writes new responses to a separate `Household_RSVPs` tab. It leaves
the previous `RSVPs` tab untouched.

The script also maintains a planner-facing `Wedding RSVPs` tab in the separate
planner workbook
`https://docs.google.com/spreadsheets/d/1-BR35gFTgLMFKOIzIcFgbj04rYEK7nWJKaJgvn4d_n4/edit`.
This tab is a one-way mirror of `Household_RSVPs` with only the external-facing columns:
`Updated At`, `Submitted By Name`, `Guest Group`, `Subgroup`, `Email`,
`Accepted Named Guests`, `Declined Named Guests`, `Additional Adult Names`,
`Child Names and Ages`, `Notes`, `Invite Scope`, `Additional Adult Contacts`,
`Total Number of Guests`, and `Phone`. Do not use this tab as the website
source of truth.

## 2. Update Apps Script

1. In the Google Sheet, open **Extensions > Apps Script**.
2. Replace the existing script with `rsvp-google-apps-script.gs`.
3. Select **Deploy > Manage deployments**.
4. Edit the current Web App deployment.
5. Choose **New version**, then deploy.
6. Keep **Execute as: Me** and **Who has access: Anyone**.

The existing `/exec` URL should remain the same.

After deploying the updated script, run `syncPlannerRsvpsManual` once from the
Apps Script editor to build or refresh the planner-facing tab from existing
responses in the planner workbook. After that, every new RSVP submission
refreshes it automatically.

If the planner-facing tab ever needs to move to a different Google Sheet, add a
script property named `PLANNER_SPREADSHEET_ID` with that sheet's ID before
running `syncPlannerRsvpsManual`.

## 3. Verify

Test these cases after deployment:

- A `both` guest sees all three wedding days.
- An `india` guest sees only Tuesday and Wednesday.
- Either person in a named couple can log in.
- A named non-login spouse appears by full name but cannot log in directly.
- A named child appears by full name and asks for age only if attending.
- A one-person household with two unnamed adult slots can submit one, two, or
  three total attendees.
- Child fields require first name, last name, and age.
- A second named login sees previously confirmed household members.
- Returning guests can add unused unnamed guest or child slots.

## Privacy

`wedding_website_guest_master_final.xlsx` is ignored by Git and removed from
future commits, but remains on the local computer. Because it existed in earlier
Git history, removing the file in a new commit does not erase the old copy from
repository history.
