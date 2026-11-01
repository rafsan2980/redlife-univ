# University Blood Donation Network — Deploy Guide (GitHub / Vercel / Node host)

## 2026-11-01 update — free, backend-soho live er jonno ja thik kora hoyeche

- `server.ts` ekhon Render er `PORT` env variable use kore (age hardcoded 3000
  chilo, tai Render e cholto na). Local test e `PORT=4001` diye chalano hoyeche.
- CORS header jog kora hoyeche, jate Vercel frontend chaile Render backend ke
  `/api` call korte pare.
- `src/lib/api.ts` ekhon `VITE_API_URL` env variable support kore. Render e
  frontend+backend ek sathe chalale eta khali rakhlei hobe. Vercel frontend ke
  Render backend er sathe jukte chaile Vercel e `VITE_API_URL` e Render URL boshao.
- `render.yaml` e `plan: free` jog kora hoyeche.
- `supabase.sql` jog kora hoyeche — Supabase e ei file ta run korlei `donors`
  table toiri hoye jabe.
- **Free tier er limit:** Render free service kichu khon na cholle ghumiye jay
  (sleep), prothom request e ~30-60 second lagte pare. Data permanently rakhte
  chaile Supabase lagbe, karon Render free te restart/redeploy hole `db.json`
  er data harate pare.

## IMPORTANT — read this first (Banglish e short e)

Ei project ta shudhu static HTML na. Eta React frontend + Express server (`server.ts`).
Frontend `/api/...` call kore, ar register/login/donor/request data server e save hoy.
Tai **shudhu Vercel e static site hisebe deploy korle page dekhte parba, kintu
register/login/search er kaj thik moto cholbe na**, karon Vercel e Express
server ta cholbe na, ar `db.json` file e lekha data Vercel e save thakbe na.

**Akdom live, sob kaj soho chaile 2 ta jinis lagbe:**
1. Code GitHub e push koro.
2. Ekta Node host e chalao — Render (sohoj, free tier e shuru kora jay) ba
   Railway / VPS. Vercel e shudhu frontend demo hisebe chalano jay.

Nicher step gulo tumi nije korba, ami tomar password/token chai na, chat e dio na.

---

## 0. Public korar age security check — eta skip koro na

- `db.json` e demo user/request data ache (nam, phone, email er moto dekhte).
  Egulo jodi asol manush er data hoy, **public GitHub repo te push korar age
  shegulo muche / bodle felo**, ba repo ta Private rakho.
- Demo login bodle felo: admin `admin123`, donor `donor123` — live e jawar age
  egulo bodlate hobe. Ekhonkar code e password plain text e thake, tai eta
  real production er jonno safe na — pore JWT + hashed password lagbe.
- Kokhono `.env` file GitHub e push koro na. `.gitignore` e `.env*` agei ache,
  shudhu `.env.example` push hobe.

## 1. GitHub e push koro

1. GitHub e giye notun repository banao, nam dao jemon
   `university-blood-donation-network`. Public na Private — uporer security
   check pore decide koro.
2. Tomar computer e terminal e ei folder e giye:
   ```bash
   git init
   git add .
   git commit -m "University Blood Donation Network"
   git branch -M main
   git remote add origin https://github.com/TOMAR-USERNAME/university-blood-donation-network.git
   git push -u origin main
   ```
   `TOMAR-USERNAME` er jaygay tomar GitHub username boshao.
3. Push hoye gele GitHub e file gulo dekhte parba kina check koro.

## 2. Puro kaj soho live koro — Render (recommended)

1. https://render.com e GitHub diye sign in koro.
2. **New → Web Service** → tomar GitHub repo ta select koro.
3. Setting gulo:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production node dist/server.cjs`
   - **Environment:** Node
   - **Instance Type:** Free (shuru korar jonno)
4. **Environment Variables** (Render er Environment section e, code e na):
   - `NODE_ENV=production`
   - `FRONTEND_URL` — Vercel frontend use korle oi URL, na hole khali rakhte paro
   - Supabase chaile (data permanently rakhte): Supabase Dashboard e giye
     notun free project banao, tarpor SQL Editor e ei folder er `supabase.sql`
     file ta run koro (donors table toiri hobe), tarpor Project Settings > API
     theke `SUPABASE_URL` ar `SUPABASE_ANON_KEY` niye Render e boshao
     (na dile local `db.json` fallback e cholbe, kintu Render free te restart
     hole data harate pare)
   - Gemini chaile: `GEMINI_API_KEY` (na dile AI feature cholbe na, baki kaj cholbe)
5. **Create Web Service** chap dao. Build shesh hole Render ekta live URL dibe,
   jemon `https://university-blood-donation-network.onrender.com`.
   Oi URL ei sob kaj cholbe: search, register, login, request, admin.

`render.yaml` file ta ei folder e ache, tai Render e Blueprint diyeo deploy kora jay.

## 3. Vercel e deploy koro — shudhu frontend demo

1. https://vercel.com e GitHub diye sign in koro.
2. **Add New → Project** → GitHub repo ta import koro.
3. Setting:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Deploy chap dao — Vercel ekta live URL dibe.

**Limit:** Vercel er ei version e `/api` cholbe na, tai register/login/data
save hobe na. Tai Vercel ke “akdom live” hisebe dhoro na — puro kaj er jonno
Section 2 (Render / Node host) lagbe.

## 4. Ki ki connect kora lagbe — checklist (tumi nije korba)

| Connect / Account | Lagbe kina | Kothay lagbe |
|---|---|---|
| GitHub account | **Lagbe** | Code push + Vercel/Render import er jonno |
| Vercel account | Optional (demo) | Frontend demo live er jonno |
| Render / Railway account | **Lagbe (puro kaj er jonno)** | Express server live chalano |
| Supabase project | Optional | Data permanently Supabase e rakhte chaile; na thakle local db.json |
| Gemini API key | Optional | AI feature chaile; na thakle baki kaj cholbe |
| Domain (optional) | Optional | Nijer domain chaile, Render/Vercel er Domain section e DNS boshao |

Kono account er password, token, ba API key amake chat e pathio na.
Prottekta service er nijer dashboard e giye boshao.

## 5. Local e test korar command

```bash
npm install
npm run build
NODE_ENV=production node dist/server.cjs
```

Tarpor browser e `http://localhost:3000` kholo.

## 5b. Pore free domain add korte chaile

1. Free domain provider theke domain nao (jemon Freenom er moto free option
   ba kono free subdomain service — provider er free plan tokhon ja thakbe
   tai use koro).
2. Render er live service ta main site hole: Render Dashboard > service >
   Settings > Custom Domains e domain ta add koro, ar domain provider e
   Render je DNS record (CNAME/A) dekhabe sheta boshao.
3. Vercel ke main site banale: Vercel Dashboard > project > Settings >
   Domains e domain ta add koro, ar provider e Vercel er DNS record boshao.
4. Domain propagate hote kichu ghonta lagte pare — tar age `.onrender.com`
   ba `.vercel.app` URL diyei site cholbe.

## 6. Update korle ki korba

Code bodle GitHub e push korlei Render/Vercel auto redeploy korbe (jodi auto
deploy on thake). Muse er live app ta alada — sheta update hole ami ekhane
janabo, kintu GitHub/Vercel er live ta tomar push er upor nirbhor korbe.
