#  NextCandle

**NextCandle** is a web-based **AI-driven stock analysis platform** that helps users predict and visualize market trends.  
It integrates **real-time stock data** with **artificial intelligence models** to forecast potential movements, summarize market news, and display insights through an interactive and modern interface.  

Built with a **Next.js** frontend and a **FastAPI** backend powered by Python, NextCandle offers a seamless experience for users seeking fast, data-backed market insights.

---

##  Key Features

###  Stock Analysis & Prediction
- Users can search for stocks and receive **AI-generated predictions** about price movements, sentiment, and trends.
- Historical data and analysis history are stored in **MongoDB** for quick retrieval and visualization.

###  AI-Powered Insights
- Analytical models in `analyzer.py` process financial data to generate intelligent summaries.
- **Sentiment analysis** and **keyword extraction** help identify market tone and emerging topics.

###  News Integration
- Pulls the **latest market news** for each company or stock symbol.
- Produces concise AI-driven summaries and sentiment polarity scores.

###  User-Friendly Dashboard
- Clean and responsive design built with **Next.js** and **Tailwind CSS**.
- Displays **interactive charts**, **performance summaries**, and **data visualizations**.
- Enables intuitive navigation between stock analysis, market news, and saved user data.

---

##  How It Works

1. **Data Retrieval**  
   The user inputs a stock symbol (e.g., `AAPL`). The frontend sends this query to the backend API.

2. **AI Analysis**  
   The **FastAPI** backend (in `main.py` and `analyzer.py`) processes data and executes AI models to generate predictions and summaries.

3. **Data Storage**  
   **MongoDB** stores user analyses, summaries, and insights for future visualization.

4. **Display**  
   The **Next.js** frontend (in `src/app/analysis/page.tsx`) retrieves and renders AI-generated insights, charts, sentiment data, and summaries.

---

##  Technologies Used

###  Frontend
- **Next.js 14** — Modular app router architecture  
- **React 18** — Component-based UI framework  
- **TypeScript** — Type safety and scalability  
- **Tailwind CSS** — Utility-first responsive styling  
- **shadcn/ui** — Prebuilt UI components for design consistency  
- **Recharts** — Visualization for financial data  

###  Backend
- **FastAPI** — High-performance Python API framework  
- **Supabase** — Optional authentication and database integration  
- **MongoDB (motor)** — Asynchronous NoSQL storage  
- **dotenv** — Environment variable management  
- **Uvicorn** — ASGI server for production or local use  

---

##  Challenges Faced and How They Were Overcome

###  Synchronizing Backend and Frontend Data
### 🔗 Synchronizing Backend and Frontend Data
**Challenge:**  
Ensuring smooth communication between the FastAPI backend and the Next.js frontend without latency or data mismatches.  

**Solution:**  
Used **Supabase** for real-time user authentication and session management, and **MongoDB** for persistent data storage and synchronization across user sessions.  
This combination allowed reliable communication between the backend API and the frontend, ensuring that data, analytics results, and user history remained consistent and up-to-date.


---

###  Managing Authentication
**Challenge:**  
Integrating Supabase-based authentication while maintaining persistent user sessions.  
**Solution:**  
Developed a modular `useAuth.ts` hook to handle login, registration, and session validation efficiently.

---

### ⚡ Handling Real-Time Updates
**Challenge:**  
Ensuring analysis results stay current with new market data.  
**Solution:**  
Implemented **client-side polling** and **React state updates**, allowing data to refresh seamlessly without reloading the page.

---

###  Frontend Consistency
**Challenge:**  
Designing a visually cohesive interface across multiple modules (stocks, news, insights).  
**Solution:**  
Used **Tailwind CSS** and **shadcn/ui** to maintain a clean, consistent, and responsive UI with minimal custom CSS.

---

##  Future Improvements

- **🧠 Google Gemini ADK Integration:**  
  Add support for the **Google Gemini ADK** to enhance natural language reasoning, predictive analytics, and market forecasting.

- **📲 Push Notifications:**  
  Integrate **Firebase Cloud Messaging (FCM)** to send alerts for stock movements, AI predictions, and breaking financial news.  

---

## 👥 Team

| Name | Role |
|------|------|
| **Dylan** | AI / Backend |
| **Sami** | Data Scraping / Backend |
| **Manny** | Database / Backend |
| **Andres** | UI & UX /Frontend|


---

## 🌍 Acknowledgements

- [Next.js](https://nextjs.org/)  
- [FastAPI](https://fastapi.tiangolo.com/)  
- [Supabase](https://supabase.com/)  
- [MongoDB](https://www.mongodb.com/)  
- [Tailwind CSS](https://tailwindcss.com/)  
- [shadcn/ui](htt)
