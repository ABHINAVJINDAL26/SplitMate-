# Splitwise Clone — Project Flow & Features Guide (Hindi/Hinglish)

Ye guide is web application (Splitwise Clone) ke saare features, screens, inputs, aur user actions ko chote se chote detail ke sath aam bhasha (non-technical) me samjhati hai. Isse koi bhi samajh sakta hai ki project me kya ho raha hai.

---

## 1. Project Kya Hai? (Overview)
Ye ek **Shared Expense Tracking Website** hai. Jab dosto ka group travel karta hai, rent share karta hai, ya lunch par jata hai, to kharche aapas me baantne (split karne) ke liye ye app use hoti hai. Kaun kisko kitne paise dega, ye app automatically calculate karke batati hai.

---

## 2. Signup / Login Screen (Pahli Screen)
Jab aap website par pehli baar jaate hain, to aapko ye screen dikhti hai. Isme do modes hote hain (Login aur Sign Up) jise niche diye gaye button se toggle kiya ja sakta hai.

*   **Sign Up Tab (Naya Account Banane Ke Liye)**:
    *   **Fields (Inputs)**:
        1.  `Full Name`: Aapka naam (e.g., Alice Smith).
        2.  `Email Address`: Aapki unique email id.
        3.  `Password`: Account secure rakhne ka password.
    *   **Actions**: "Sign Up" button click karne par aapka account ban jata hai, system aapki email ke hisab se ek unique cartoon avatar photo assign kar deta hai, aur aap login hokar seedhe dashboard par chale jaate hain.
*   **Login Tab (Purane Users Ke Liye)**:
    *   **Fields (Inputs)**:
        1.  `Email Address`: Registered email.
        2.  `Password`: Password.
    *   **Actions**: "Sign In" button click karne par aap secure JWT session cookie ke sath login ho jate hain.
*   **Error Handling**: Agar galat email/password enter karenge ya email pehle se registered hai, to red-box me error message show hoga (e.g., "Invalid email or password").

---

## 3. Login Ke Baad Main Screen (Layout)
Login karne ke baad screen **do sections** me split ho jaati hai:
1.  **Left Sidebar (Navigation Pane)**: Ye hamesha screen ke left side me rehta hai.
2.  **Right Main Panel (Content Pane)**: Yaha aapka active dashboard ya group details show hoti hain.

### Left Sidebar Features:
*   **Logo & Title**: Upur `⇅ Splitwise` ka icon aur title dikhta hai.
*   **Logout Button**: Right-up corner me `Logout ↗` button hai, jise click karne par session cookies clear ho jaati hain aur aap wapas Login screen par chale jaate hain.
*   **User Card (Profile)**: Aapka photo (avatar), naam, aur email dikhta hai.
*   **Dashboard Summary Link**: Ek icon ke sath button hai, jise click karne par right-side me global balances dashboard khul jata hai.
*   **My Groups Section**:
    *   Aapke saare active groups ki list (e.g., "Ski Trip 2026").
    *   Kisi group par click karne par right-side me us group ka khata khul jata hai.
    *   **`+ Add` Button**: Is par click karte hi sidebar me ek form khul jata hai naya group banane ke liye:
        *   `Group name` field (required).
        *   `Short description` field (optional).
        *   `Save` click karne par group ban jata hai aur aap automatically join ho jate hain.
        *   `Cancel` click karne par form band ho jata hai.

---

## 4. Dashboard Summary Screen (Default View)
Jab aap bina kisi group ke login karte hain, ya left sidebar me "Dashboard Summary" click karte hain, tab ye screen right panel me aati hai.

*   **Overall Balances (3 Main Cards)**:
    1.  `Total Net Balance`: Aapka kul net hisab. Agar positive hai to green color me (e.g., `+₹800.00`), iska matlab aapko paise lene hain. Agar negative hai to red color me (e.g., `-₹300.00`), iska matlab aapko paise dene hain.
    2.  `You Are Owed`: Dosto se total kitna paisa lena hai (Hamesha Green text).
    3.  `You Owe`: Dosto ko total kitna paisa dena hai (Hamesha Red text).
*   **Global Debts Summary (Sabhi Dosto Ka Hisab)**:
    *   Yaha sabhi logo ki details aati hain jinke sath aapka balance baaki hai (pure groups ko mila kar).
    *   Har dosto ka avatar (photo), naam, aur email dikhta hai.
    *   Right side me green ya red text me dikhta hai:
        *   `owes you ₹X` (e.g., "Bob Jones owes you ₹400.00") ➔ Wo dosto aapko paise dega.
        *   `you owe ₹X` (e.g., "You owe Charlie Brown ₹100.00") ➔ Aapko us dosto ko paise dene hain.
    *   Agar sabhi dosto ke sath aapka hisab 0 hai, to yaha message show hoga: `You are completely settled up globally! 🌟`.

---

## 5. Group Detail Screen
Jab aap left sidebar se kisi specific Group (e.g., "Ski Trip 2026") par click karte hain, to ye dashboard khulta hai.

### Group Header (Upar ka hissa):
*   Group ka naam aur description (e.g. "Ski Trip 2026 - Alps travel expenses").
*   Do main buttons:
    *   `💸 Settle Up`: Paise wapas dene ya hisab barabar karne ke liye popup open karega.
    *   `➕ Add Expense`: Naya kharcha jodte samay popup open karega.

### Group Grid Layout (Niche ka hissa - teen columns):

#### Section A: Group History (Middle-Left Panel)
*   Yaha group me ab tak hue saare expenses (kharche) aur settlements (repayments) ki list dikhti hai (sabse naya kharcha upar).
*   **Transaction Card Details**:
    *   *Icon*: `🍔` agar kharcha hai, `🤝` agar settle-up payment hai.
    *   *Description*: Kharche ka naam (e.g., "Alps Lodge Lunch").
    *   *Metadata*: Kisne pay kiya aur kis date-time par entry hui (e.g., "Paid by Alice Smith • Jun 12, 01:44 PM").
    *   *Paisa (Amount)*: Total kharcha (e.g., `₹300.00`).
    *   *Aapka status (Relative Balances)*:
        *   `You lent ₹X` (Green): Agar apne pay kiya tha, to baki logo ka hisab jod kar aayega.
        *   `You owe ₹X` (Red): Agar kisi aur ne pay kiya tha aur aap usme shamil the.
        *   `You settled up` (Blue) / `Received payment` (Green): Settlement transactions ke liye.
    *   **Action**: Kisi bhi transaction par click karne par right side me **Transaction Details Drawer** khul jayega.

#### Section B: Group Members (Middle-Right Panel)
*   Group ke saare active logo ki list (avatars aur names).
*   **Remove Member (✕ button)**: Agar aap group creator/admin hain, to aapko dosto ke naam ke aage ek red color ka `✕` button dikhega. Is button par click karke aap kisi member ko group se nikal sakte hain, par iski ek shart hai: unka balance group me exactly ₹0 (settled) होना चाहिए. Agar outstanding balance hai, to error message aayega. Creator khud ko group se nahi nikal sakta.
*   **Invite Member Form**:
    *   `Invite member email` text field.
    *   `Invite` button.
    *   **Action**: Email likh kar Invite dabayein. Agar wo user pehle se app me hai, to turant group me add ho jayega. Agar user app par nahi hai, to background me ek default account (password: `Password123!`) ban kar group me add ho jayega taaki calculations chalti rahein.

#### Section C: Simplified Debts (Bottom-Right Panel)
*   Splitwise ka smart feature! Group me kai kharche hone ke baad aapas me paise ghumane ke bajaye ye app resolve karke seedhe batati hai ki **kis member ko kis member ko kitne paise dene hain** taaki sabka hisab clear ho jaye.
*   Format: `Debtor Name ➔ Creditor Name: ₹Amount`
    *   *Example*: `Bob Jones ➔ Alice Smith: ₹400.00` (Iska matlab Bob direct Alice ko ₹400 dega aur dono clear ho jayenge).
    *   Agar koi debt bacha hi nahi hai to dikhega: `Everything settled inside this group! ☀️`.

---

## 6. Add Expense Modal (Kharche Jodne Ka Popup)
Jab aap `➕ Add Expense` button par click karte hain, to ye screen ke center me ek popup card khulta hai.

*   **Inputs & Fields**:
    1.  `Description`: Kharche ka naam (e.g., "Taxi to Alps").
    2.  `Amount (₹)`: Total bill amount (e.g., `900`).
    3.  `Paid By`: Dropdown, kisne payment kiya (alice, bob ya charlie).
    4.  `Split Option`: Dropdown, kharche ko baantne ke 4 tarike hain:
        *   **Split Equally**: Sabhi ke beech paise barabar baante jaate hain (e.g. ₹900 teen logo me, har ek ke share me automatic ₹300.00 dikhega).
        *   **Split Unequally (₹)**: Har ek person ka custom amount select karne ka input box aa jata hai.
        *   **Split by Percentage (%)**: Har member ka custom share % me enter karne ka input box (e.g., Alice: 50%, Bob: 30%, Charlie: 20%).
        *   **Split by Shares**: Shares ratio (e.g. Alice: 2 shares, Bob: 1 share, Charlie: 0 shares).
    5.  `Split Breakdown Checklist`:
        *   Har user ke naam ke aage checkbox hai. Agar koi dosto kharche me shamil nahi tha, to checkbox untick karke use split se bahar kar sakte hain. Share automatic recalculate ho jayega.
*   **Live Math Validation**:
    *   Agar unequal amounts ka total main amount se match nahi karta, ya percentages ka sum 100% nahi hota, to niche **Red error text** me live calculation dikhegi: (e.g., `Sum: ₹850.00 / ₹900.00 (need ₹50.00 more)`).
    *   Agar calculation sahi ho jaye to message green ho jata hai (`Matched!`).
*   **Actions**:
    *   `Cancel` button: Modal band karega.
    *   `Add Expense` (Submit) button: Agar validation sahi hai, to kharcha save karke group balances update kar dega.

---

## 7. Settle Up Modal (Paise Lautane Ka Popup)
Jab koi member aapas ka debt clear karta hai to `💸 Settle Up` click karta hai.

*   **Inputs & Fields**:
    1.  `Who Paid?`: Dropdown, kisne paise diye/repay kiye (e.g. Bob Jones).
    2.  `Who Received?`: Dropdown, kisko paise mile (e.g. Alice Smith).
    3.  `Amount (₹)`: Kitne paise transfer kiye (e.g., `100.00`).
    4.  `Note (optional)`: Settle up note (e.g., "Settled dinner cash").
*   **Actions**:
    *   `Cancel` button: Modal bina save kiye band.
    *   `Record Payment` button: Database me settlement entry save karega aur group history & simplified debts ke balances net-down (kam) kar dega.

---

## 8. Transaction Details Drawer (Slide-out Details Panel)
Jab aap Group History timeline me kisi bhi expense/settlement card par click karte hain, to right-side se ek slider box nikalta hai.

*   **Top Header**: Transaction ka title aur details close button (`×`).
*   **Split Breakdown Section**:
    *   Total Amount (₹) kitna tha.
    *   Kisne pay kiya.
    *   Niche group members ke split shares details: har ek member ka naam aur unke hisse ka exact amount (e.g., `Bob Jones: 30% • ₹300.00`).
    *   **Edit aur Delete buttons**: Splits breakdown block ke just niche action buttons aayenge (sirf usey jisne expense add kiya ho ya group creator ko dikhenge).
        *   `✏️ Edit`: Click karne par "Edit Shared Expense" popup open ho jata hai jisme pehle ke saare details pre-filled hote hain, jise edit karke recalculation ho jayegi.
        *   `🗑️ Delete`: Click karne par confirmation dialog box aayega, confirm karne par expense cascade delete ho jayega (history aur balances se gayab ho jayega, aur comments chat bhi clear ho jayenge).
*   **Expense Chat / Comments Section (Real-time Discussion)**:
    *   Har kharche par discussion karne ka chat feed box.
    *   *Messages layout*:
        *   Aapke bhejey hue comments purple color ke bubble me right side me show hote hain (sath me time).
        *   Baki members ke bhejey hue messages left side me dark-grey bubble me unke naam ke sath show hote hain.
    *   *Input field*: Niche `Ask a question...` input box aur `Send` button hai comment likh kar bhejne ke liye.
    *   *Polling Feature*: Naye comments check karne ke liye background me app har 4 seconds me check karti hai aur feed ko automatically update rakhti hai bina page refresh kiye.

---

## 9. User Profile Modal & Avatar Selection (Sidebar Click)
Left sidebar me niche user card section par, ya pure app me kisi bhi member ke avatar/name par click karne se ek sleek glassmorphic modal popup hota hai:
*   **Profile Image (Avatar)**: Aapka active avatar picture.
*   **Details List**:
    *   *Full Name*: User-name.
    *   *Email Address*: Account email.
    *   *Member Since*: User ke register karne ki date.
    *   *Joined Groups*: User total kitne groups ka member hai (is dynamic tag me data ab clear dikhega).
*   **Edit Profile Feature (Self Only)**:
    *   Agar aap khud ki profile dekh rahe hain, to modal me `✏️ Edit Profile` button dikhta hai.
    *   Is button par click karne se edit form khul jata hai jaha aap:
        1.  `Full Name` edit kar sakte hain.
        2.  `Pre-defined Cartoon Avatar Characters`: 8 standard interactive avatar characters (Cute bots, Adventurers, Anime Boy/Girl, retro pixel art, etc.) me se single click par avatar choose kar sakte hain.
        3.  `Custom Avatar Image URL`: Predefined character choose karne ke bajaye aap khud ka custom picture URL bhi text-box me input kar sakte hain (e.g. dynamic profile pictures ya direct links).
    *   `Save Changes` click karne par changes database update hokar local page state me instant sync ho jate hain, jisse aapka updated avatar pure group members, comments, aur sidebar list me instantly dikhne lagta hai.
*   **Action**: `Close Profile` aur `Cancel` inputs modal dismiss karne ke liye hain.

---

## 10. Login / SignUp Professional Security Features
App ke authentication module ko extreme tight security aur enterprise compliance ke hisab se design kiya gaya hai:
1.  **Email Validation**: Domain format regex verification check kiya jata hai taaki koi fake email address na enter ho sake.
2.  **Strict Password Strength Rules**: Naya account banate (Sign Up) samay strong validation filter check kiya jata hai:
    *   Minimum **8 characters** length honi chahiye.
    *   Kam se kam **1 uppercase letter** (A-Z) hona chahiye.
    *   Kam se kam **1 lowercase letter** (a-z) hona chahiye.
    *   Kam se kam **1 number** (0-9) hona chahiye.
    *   Kam se kam **1 special character symbol** (e.g. `@`, `$`, `!`, `%`, `*`, `?`, `&`) hona chahiye.
    *   Rules se match na karne par instantly frontend warning error message box show hota hai.
3.  **Password Show/Hide Toggle (👁️ / 👁️‍🗨️ icon)**: Password text fields ke clear visibility safety click action icons diye gaye hain taaki types handle karne me password leakage aur typing mistakes na hon.

