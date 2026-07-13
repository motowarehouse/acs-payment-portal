export type Locale = 'en' | 'gr'

// Every user-facing string. Missing Greek keys fall back to English, then the
// key itself — so partial translation never breaks the UI.
type Entry = { en: string; gr: string }

const D = {
  // Brand / nav
  brandSub:        { en: 'ACS Payments',        gr: 'Πληρωμές ACS' },
  nav_home:        { en: 'Home',                gr: 'Αρχική' },
  nav_dashboard:   { en: 'Dashboard',           gr: 'Πίνακας' },
  nav_import:      { en: 'Import',              gr: 'Εισαγωγή' },
  nav_cheques:     { en: 'Cheques',             gr: 'Επιταγές' },
  nav_shipments:   { en: 'Shipments',           gr: 'Αποστολές' },
  nav_outstanding: { en: 'Outstanding',         gr: 'Οφειλές' },
  nav_exceptions:  { en: 'Exceptions',          gr: 'Έλεγχος' },
  nav_customers:   { en: 'Customers',           gr: 'Πελάτες' },
  signOut:         { en: 'Sign Out',            gr: 'Αποσύνδεση' },
  language:        { en: 'Language',            gr: 'Γλώσσα' },
  nav_manual:      { en: 'User manual',         gr: 'Εγχειρίδιο' },
  nav_guide:       { en: 'Guide',               gr: 'Οδηγός' },

  // Guide / animated walkthrough
  guide_title:     { en: 'How it works',        gr: 'Πώς λειτουργεί' },
  guide_sub:       { en: 'A quick walkthrough of the daily routine. Press play and watch.', gr: 'Μια γρήγορη παρουσίαση της καθημερινής ρουτίνας. Πατήστε αναπαραγωγή.' },
  g_play:          { en: 'Play',                gr: 'Αναπαραγωγή' },
  g_pause:         { en: 'Pause',               gr: 'Παύση' },
  g_restart:       { en: 'Restart',             gr: 'Επανεκκίνηση' },
  g_step:          { en: 'Step',                gr: 'Βήμα' },
  g_intro:         { en: 'This is your Home page — the checklist for the day.', gr: 'Αυτή είναι η Αρχική σας — η λίστα της ημέρας.' },
  g_open_import:   { en: 'Click Import to upload your files.', gr: 'Κάντε κλικ στην Εισαγωγή για να ανεβάσετε τα αρχεία.' },
  g_drop_file1:    { en: 'Drop the last-30-days shipment file into File 1.', gr: 'Σύρετε το αρχείο αποστολών των τελευταίων 30 ημερών στο Αρχείο 1.' },
  g_file1_done:    { en: 'Done — new shipments are added, existing ones updated.', gr: 'Έτοιμο — νέες αποστολές προστέθηκαν, οι υπάρχουσες ενημερώθηκαν.' },
  g_drop_file2:    { en: 'Drop the ACS Cash / Visa payments into File 2.', gr: 'Σύρετε τις πληρωμές Μετρητά / Κάρτα ACS στο Αρχείο 2.' },
  g_file2_done:    { en: 'Payments are matched to their shipments automatically.', gr: 'Οι πληρωμές αντιστοιχίζονται αυτόματα στις αποστολές.' },
  g_cheque:        { en: 'For cheques, type the tracking number and click Find.', gr: 'Για επιταγές, γράψτε τον αριθμό και κάντε κλικ στην Αναζήτηση.' },
  g_cheque_record: { en: 'Fill in the cheque details and record it.', gr: 'Συμπληρώστε τα στοιχεία της επιταγής και καταχωρήστε την.' },
  g_review:        { en: 'Finally, check Exceptions and clear anything flagged.', gr: 'Τέλος, ελέγξτε τον Έλεγχο και τακτοποιήστε ό,τι επισημαίνεται.' },
  g_done:          { en: 'That’s the daily routine — everything is reconciled.', gr: 'Αυτή είναι η καθημερινή ρουτίνα — όλα συμφωνήθηκαν.' },

  // Common
  apply:      { en: 'Apply',      gr: 'Εφαρμογή' },
  clear:      { en: 'Clear',      gr: 'Καθαρισμός' },
  cancel:     { en: 'Cancel',     gr: 'Ακύρωση' },
  save:       { en: 'Save',       gr: 'Αποθήκευση' },
  add:        { en: 'Add',        gr: 'Προσθήκη' },
  find:       { en: 'Find',       gr: 'Αναζήτηση' },
  remaining:  { en: 'remaining',  gr: 'υπόλοιπο' },
  settled:    { en: 'Settled',    gr: 'Εξοφλήθηκε' },
  of:         { en: 'of',         gr: 'από' },
  paid:       { en: 'Paid',       gr: 'Πληρωμένο' },

  // Today home
  today_title:      { en: 'Today',    gr: 'Σήμερα' },
  today_sub:        { en: 'Your checklist for today. Work top to bottom.', gr: 'Η λίστα σας για σήμερα. Ακολουθήστε τη σειρά.' },
  today_greeting:   { en: 'Good day', gr: 'Καλή μέρα' },
  step_shipments:   { en: 'Import the shipment file (File 1)', gr: 'Εισαγωγή αρχείου αποστολών (Αρχείο 1)' },
  step_shipments_d: { en: 'Upload the ACS shipment file for the last 30 days.', gr: 'Ανεβάστε το αρχείο αποστολών ACS των τελευταίων 30 ημερών.' },
  step_payments:    { en: 'Import the Cash / Visa payments (File 2)', gr: 'Εισαγωγή πληρωμών Μετρητά / Κάρτα (Αρχείο 2)' },
  step_payments_d:  { en: 'Upload the ACS Notification of Payment file when it arrives.', gr: 'Ανεβάστε το αρχείο πληρωμών ACS όταν το λάβετε.' },
  step_cheques:     { en: 'Enter any cheques', gr: 'Καταχώρηση επιταγών' },
  step_cheques_d:   { en: 'Type in the cheques delivered with the ACS cheque list.', gr: 'Καταχωρήστε τις επιταγές που παραδόθηκαν με τη λίστα ACS.' },
  step_review:      { en: 'Review items that need you', gr: 'Έλεγχος εκκρεμοτήτων' },
  step_review_d:    { en: 'Unmatched payments, mismatches and duplicates.', gr: 'Ασυμφωνίες, αταίριαστες πληρωμές και διπλότυπα.' },
  done:             { en: 'Done', gr: 'Έγινε' },
  todo:             { en: 'To do', gr: 'Εκκρεμεί' },
  optional:         { en: 'As needed', gr: 'Όποτε χρειάζεται' },
  today_allclear:   { en: 'All clear — nothing needs review.', gr: 'Όλα εντάξει — δεν υπάρχουν εκκρεμότητες.' },
  open:             { en: 'Open', gr: 'Άνοιγμα' },
  enteredToday:     { en: 'entered today', gr: 'σήμερα' },
  needReview:       { en: 'need review', gr: 'προς έλεγχο' },

  // Dashboard
  dash_title:      { en: 'Dashboard', gr: 'Πίνακας' },
  dash_sub:        { en: 'ACS shipment and COD payment reconciliation', gr: 'Συμφωνία αποστολών και πληρωμών αντικαταβολής ACS' },
  importFiles:     { en: 'Import files', gr: 'Εισαγωγή αρχείων' },
  kpi_outstanding: { en: 'Outstanding COD', gr: 'Ανείσπρακτη αντικαταβολή' },
  kpi_awaiting:    { en: 'Awaiting payment', gr: 'Σε αναμονή πληρωμής' },
  kpi_collected:   { en: 'Collected (all time)', gr: 'Εισπράχθηκαν (σύνολο)' },
  kpi_review:      { en: 'Needs review', gr: 'Προς έλεγχο' },
  shipmentStatus:  { en: 'Shipment status', gr: 'Κατάσταση αποστολών' },
  todaysRecon:     { en: 'Today’s reconciliation', gr: 'Συμφωνία σήμερα' },
  sinceMidnight:   { en: 'Payments recorded since midnight', gr: 'Πληρωμές από τα μεσάνυχτα' },
  payments:        { en: 'payments', gr: 'πληρωμές' },
  collectedToday:  { en: 'collected today', gr: 'εισπράχθηκαν σήμερα' },
  viewOutstanding: { en: 'View outstanding COD', gr: 'Δείτε τις οφειλές' },
  recentActivity:  { en: 'Recent activity', gr: 'Πρόσφατη δραστηριότητα' },
  noImportsYet:    { en: 'No imports yet. Go to Import to upload your first shipment file.', gr: 'Καμία εισαγωγή ακόμη. Πηγαίνετε στην Εισαγωγή για το πρώτο αρχείο.' },

  // Import
  import_title:    { en: 'Import', gr: 'Εισαγωγή' },
  import_sub:      { en: 'Upload the shipment file for the last 30 days and the ACS payment notifications. Re-uploading updates existing shipments and adds new ones — matching by tracking number.', gr: 'Ανεβάστε το αρχείο αποστολών των τελευταίων 30 ημερών και τις ειδοποιήσεις πληρωμής ACS. Η επανεισαγωγή ενημερώνει τις υπάρχουσες αποστολές και προσθέτει νέες — με βάση τον αριθμό αποστολής.' },
  file1_title:     { en: 'File 1 — Shipments', gr: 'Αρχείο 1 — Αποστολές' },
  file1_sub:       { en: 'ΑΝΑΖΗΤΗΣΗ ΑΠΟΣΤΟΛΩΝ · last 30 days', gr: 'ΑΝΑΖΗΤΗΣΗ ΑΠΟΣΤΟΛΩΝ · τελευταίες 30 ημέρες' },
  file2_title:     { en: 'File 2 — Cash / Visa payments', gr: 'Αρχείο 2 — Πληρωμές Μετρητά / Κάρτα' },
  file2_sub:       { en: 'ACS Notification of Payment', gr: 'Ειδοποίηση Πληρωμής ACS' },
  dropHere:        { en: 'Drop file here or click to browse', gr: 'Σύρετε το αρχείο ή κάντε κλικ για επιλογή' },
  importing:       { en: 'Importing…', gr: 'Εισαγωγή…' },
  excelFile:       { en: 'Excel file', gr: 'Αρχείο Excel' },
  recentImports:   { en: 'Recent imports', gr: 'Πρόσφατες εισαγωγές' },
  col_type:        { en: 'Type', gr: 'Τύπος' },
  col_file:        { en: 'File', gr: 'Αρχείο' },
  col_when:        { en: 'When', gr: 'Πότε' },
  col_by:          { en: 'By', gr: 'Από' },
  col_result:      { en: 'Result', gr: 'Αποτέλεσμα' },
  undo:            { en: 'Undo', gr: 'Αναίρεση' },
  undoConfirm:     { en: 'Undo this import?', gr: 'Αναίρεση αυτής της εισαγωγής;' },
  undoing:         { en: 'Undoing…', gr: 'Αναίρεση…' },

  // Cheques
  cheques_title:   { en: 'Cheques', gr: 'Επιταγές' },
  cheques_sub:     { en: 'Record cheque payments that arrive physically with the ACS cheque list.', gr: 'Καταχωρήστε τις επιταγές που παραδίδονται με τη λίστα επιταγών ACS.' },
  cheque_card:     { en: 'Record a cheque payment', gr: 'Καταχώρηση πληρωμής με επιταγή' },
  cheque_card_sub: { en: 'Enter the shipment tracking number, then the cheque details', gr: 'Εισάγετε τον αριθμό αποστολής και μετά τα στοιχεία της επιταγής' },
  trackingLabel:   { en: 'Tracking number (POD Δ.Δ.)', gr: 'Αριθμός αποστολής (POD Δ.Δ.)' },
  cod:             { en: 'COD', gr: 'Αντικαταβολή' },
  paidSoFar:       { en: 'Paid so far', gr: 'Πληρώθηκε' },
  bank:            { en: 'Bank', gr: 'Τράπεζα' },
  chequeNo:        { en: 'Cheque number (Αρ. Επιταγής)', gr: 'Αριθμός επιταγής' },
  amount:          { en: 'Amount (€)', gr: 'Ποσό (€)' },
  paymentDate:     { en: 'Payment date', gr: 'Ημ. πληρωμής' },
  recordCheque:    { en: 'Record cheque', gr: 'Καταχώρηση επιταγής' },
  recentCheques:   { en: 'Recent cheques', gr: 'Πρόσφατες επιταγές' },
  noCheques:       { en: 'No cheques recorded yet.', gr: 'Καμία επιταγή ακόμη.' },
  recipient:       { en: 'Recipient', gr: 'Παραλήπτης' },
  chequeNotFound:  { en: 'No shipment found with that tracking number. You can still record the cheque; it will appear under Exceptions until a matching shipment is imported.', gr: 'Δεν βρέθηκε αποστολή με αυτόν τον αριθμό. Μπορείτε να καταχωρήσετε την επιταγή· θα εμφανιστεί στον Έλεγχο μέχρι να εισαχθεί η αποστολή.' },

  // Shipments
  ship_title:      { en: 'Shipments', gr: 'Αποστολές' },
  ship_shown:      { en: 'shown · click a tracking number to view and reconcile', gr: 'εμφανίζονται · κάντε κλικ σε έναν αριθμό για προβολή' },
  searchPlaceholder: { en: 'Search tracking number or recipient…', gr: 'Αναζήτηση αριθμού ή παραλήπτη…' },
  allStatuses:     { en: 'All statuses', gr: 'Όλες οι καταστάσεις' },
  allDirections:   { en: 'All directions', gr: 'Όλες οι κατευθύνσεις' },
  col_tracking:    { en: 'Tracking', gr: 'Αριθμός' },
  col_recipient:   { en: 'Recipient', gr: 'Παραλήπτης' },
  col_dir:         { en: 'Dir.', gr: 'Κατ.' },
  col_pickup:      { en: 'Pickup', gr: 'Παραλαβή' },
  col_cod:         { en: 'COD', gr: 'Αντικατ.' },
  col_paid:        { en: 'Paid', gr: 'Πληρώθηκε' },
  col_status:      { en: 'Status', gr: 'Κατάσταση' },
  noMatch:         { en: 'No shipments match these filters.', gr: 'Καμία αποστολή δεν ταιριάζει.' },
  ship_empty:      { en: 'No shipments yet. Import a shipment file to get started.', gr: 'Καμία αποστολή ακόμη. Εισάγετε ένα αρχείο αποστολών.' },
  goToImport:      { en: 'Go to Import', gr: 'Μετάβαση στην Εισαγωγή' },

  // Shipment detail
  back_ship:       { en: 'Back to shipments', gr: 'Πίσω στις αποστολές' },
  codAmount:       { en: 'COD amount', gr: 'Ποσό αντικαταβολής' },
  addPayment:      { en: 'Add payment', gr: 'Προσθήκη πληρωμής' },
  method:          { en: 'Method', gr: 'Τρόπος' },
  noPayments:      { en: 'No payments recorded for this shipment yet.', gr: 'Καμία πληρωμή για αυτή την αποστολή ακόμη.' },
  status:          { en: 'Status', gr: 'Κατάσταση' },
  clearOverride:   { en: 'Clear manual override', gr: 'Επαναφορά αυτόματης κατάστασης' },
  statusAuto:      { en: 'Set automatically from payments.', gr: 'Ορίζεται αυτόματα από τις πληρωμές.' },
  statusManualNote:{ en: 'Manually set. Auto-reconciliation is paused for this shipment.', gr: 'Ορίστηκε χειροκίνητα. Η αυτόματη συμφωνία είναι σε παύση.' },
  notes:           { en: 'Notes', gr: 'Σημειώσεις' },
  saveNote:        { en: 'Save note', gr: 'Αποθήκευση' },
  addNote:         { en: 'Add a note…', gr: 'Προσθέστε σημείωση…' },
  deletePaymentQ:  { en: 'Delete?', gr: 'Διαγραφή;' },
  fact_tracking:   { en: 'Tracking number', gr: 'Αριθμός αποστολής' },
  fact_recipient:  { en: 'Recipient', gr: 'Παραλήπτης' },
  fact_code:       { en: 'Customer code', gr: 'Κωδικός πελάτη' },
  fact_route:      { en: 'Route', gr: 'Διαδρομή' },
  fact_pickup:     { en: 'Pickup date', gr: 'Ημ. παραλαβής' },
  fact_delivered:  { en: 'Delivered', gr: 'Παραδόθηκε' },
  fact_sender:     { en: 'Sender', gr: 'Αποστολέας' },
  fact_products:   { en: 'Products', gr: 'Προϊόντα' },

  // Outstanding
  out_title:       { en: 'Outstanding COD', gr: 'Ανείσπρακτη αντικαταβολή' },
  out_sub_one:     { en: 'shipment still owing', gr: 'αποστολή με οφειλή' },
  out_sub_many:    { en: 'shipments still owing', gr: 'αποστολές με οφειλή' },
  totalOutstanding:{ en: 'total outstanding', gr: 'σύνολο οφειλών' },
  allCaught:       { en: 'All caught up', gr: 'Όλα εξοφλημένα' },
  allCaughtSub:    { en: 'Every COD shipment has been fully paid.', gr: 'Όλες οι αποστολές αντικαταβολής εξοφλήθηκαν.' },

  // Exceptions
  exc_title:       { en: 'Exceptions', gr: 'Έλεγχος' },
  exc_sub:         { en: 'Everything that needs a human to look at it: short collections, mismatched amounts, payments with no shipment, and duplicate tracking numbers.', gr: 'Όσα χρειάζονται έλεγχο: ελλιπείς εισπράξεις, ασυμφωνίες ποσών, πληρωμές χωρίς αποστολή και διπλότυπα.' },
  nothingReview:   { en: 'Nothing to review', gr: 'Καμία εκκρεμότητα' },
  nothingReviewSub:{ en: 'All payments are matched and reconciled.', gr: 'Όλες οι πληρωμές είναι αντιστοιχισμένες.' },
  amountExc:       { en: 'Amount exceptions', gr: 'Ασυμφωνίες ποσού' },
  amountExcSub:    { en: 'Overpaid, or a payment landed on a shipment with no COD.', gr: 'Υπερπληρωμή ή πληρωμή σε αποστολή χωρίς αντικαταβολή.' },
  shortColl:       { en: 'Short collections', gr: 'Ελλιπείς εισπράξεις' },
  shortCollSub:    { en: 'Less was collected than the COD. Review whether the rest is still coming.', gr: 'Εισπράχθηκε λιγότερο από την αντικαταβολή. Ελέγξτε αν εκκρεμεί το υπόλοιπο.' },
  unmatchedTitle:  { en: 'Unmatched payments', gr: 'Αταίριαστες πληρωμές' },
  unmatchedSub:    { en: 'A payment came in but no shipment has this tracking number yet. It will match automatically once the shipment is imported.', gr: 'Ήρθε πληρωμή αλλά καμία αποστολή δεν έχει αυτόν τον αριθμό. Θα αντιστοιχιστεί μόλις εισαχθεί η αποστολή.' },
  dupTitle:        { en: 'Duplicate tracking numbers', gr: 'Διπλότυποι αριθμοί' },
  dupSub:          { en: 'These tracking numbers appeared more than once in an import.', gr: 'Αυτοί οι αριθμοί εμφανίστηκαν πάνω από μία φορά.' },
  col_method:      { en: 'Method', gr: 'Τρόπος' },
  col_recorded:    { en: 'Recorded', gr: 'Καταχωρήθηκε' },
  col_short:       { en: 'Short by', gr: 'Έλλειμμα' },

  // Customers
  cust_title:      { en: 'Customers', gr: 'Πελάτες' },
  cust_sub:        { en: 'customers with COD shipments', gr: 'πελάτες με αποστολές αντικαταβολής' },
  col_customer:    { en: 'Customer', gr: 'Πελάτης' },
  col_code:        { en: 'Code', gr: 'Κωδικός' },
  col_shipments:   { en: 'Shipments', gr: 'Αποστολές' },
  col_codtotal:    { en: 'COD total', gr: 'Σύνολο αντικατ.' },
  col_collected:   { en: 'Collected', gr: 'Εισπράχθηκαν' },
  col_outstanding: { en: 'Outstanding', gr: 'Οφειλή' },
  cust_empty:      { en: 'No COD shipments imported yet.', gr: 'Καμία αποστολή αντικαταβολής ακόμη.' },
  total:           { en: 'Total', gr: 'Σύνολο' },

  // Copy to clipboard
  copyTracking:    { en: 'Copy tracking number', gr: 'Αντιγραφή αριθμού' },
  copied:          { en: 'Copied!', gr: 'Αντιγράφηκε!' },

  // Cheque lifecycle
  markCleared:     { en: 'Mark as cleared', gr: 'Σήμανση ως εξοφλημένη' },
  markBounced:     { en: 'Mark as bounced', gr: 'Σήμανση ως ακάλυπτη' },
  markPending:     { en: 'Back to pending', gr: 'Επαναφορά σε εκκρεμή' },
  chequesPending:  { en: 'pending', gr: 'εκκρεμούν' },
  dupCheque:       { en: 'This cheque number is already recorded', gr: 'Αυτός ο αριθμός επιταγής έχει ήδη καταχωρηθεί' },
  saveAnyway:      { en: 'Save anyway', gr: 'Αποθήκευση ούτως ή άλλως' },

  // Outstanding aging & export
  col_days:        { en: 'Days', gr: 'Ημέρες' },
  exportExcel:     { en: 'Export Excel', gr: 'Εξαγωγή Excel' },

  // History & backup
  history:         { en: 'History', gr: 'Ιστορικό' },
  noHistory:       { en: 'No changes recorded yet.', gr: 'Καμία καταγεγραμμένη αλλαγή ακόμη.' },
  downloadBackup:  { en: 'Download backup', gr: 'Λήψη αντιγράφου' },
  downloadBackupSub: { en: 'Full Excel backup of all shipments, payments and imports', gr: 'Πλήρες αντίγραφο Excel όλων των αποστολών, πληρωμών και εισαγωγών' },
} satisfies Record<string, Entry>

export type TKey = keyof typeof D

export function t(locale: Locale): (key: TKey) => string {
  return (key) => {
    const entry = D[key]
    if (!entry) return String(key)
    return entry[locale] || entry.en || String(key)
  }
}
