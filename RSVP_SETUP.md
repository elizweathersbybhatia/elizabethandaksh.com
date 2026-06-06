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

- Named logins from `Login_Master`
- Total invited seats and event access from `Household_Master`
- Unnamed adult capacity as:
  `total_guests - login_count - children_count`
- Child capacity from `children_count`

The source workbook is not modified.

The script writes new responses to a separate `Household_RSVPs` tab. It leaves
the previous `RSVPs` tab untouched.

## 2. Update Apps Script

1. In the Google Sheet, open **Extensions > Apps Script**.
2. Replace the existing script with `rsvp-google-apps-script.gs`.
3. Select **Deploy > Manage deployments**.
4. Edit the current Web App deployment.
5. Choose **New version**, then deploy.
6. Keep **Execute as: Me** and **Who has access: Anyone**.

The existing `/exec` URL should remain the same.

## 3. Verify

Test these cases after deployment:

- A `both` guest sees all three wedding days.
- An `india` guest sees only Tuesday and Wednesday.
- Either person in a named couple can log in.
- A named partner appears by full name, not as an unnamed guest.
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
