window.AdminModules = window.AdminModules || {};
window.AdminModules["metrics"] = {
  init: async function (container) {
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading metrics...</p>`;
    const supabase = window.supabase;

    try {
      // 1️⃣ Total Users
      const { data: users, error: userErr } = await supabase
        .from("users")
        .select("id, email, plan")
        .order("created_at", { ascending: false });
      if (userErr) throw userErr;

      // Plan filter setup
      const uniquePlans = [...new Set(users.map(u => u.plan || "free"))];
      const planOptions = uniquePlans.map(p => `<option value="${p}">${p}</option>`).join("");

      container.innerHTML = `
        <div class="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <label class="text-sm">🔍 Filter by plan: 
            <select id="planFilter" class="ml-2 px-2 py-1 border rounded dark:bg-gray-800 dark:border-gray-600">
              <option value="all">All</option>
              ${planOptions}
            </select>
          </label>
          <button id="exportMetricsCSV" class="bg-blue-600 text-white px-4 py-2 rounded text-sm">📁 Export CSV</button>
        </div>
        <div id="metricsContent">Loading...</div>
        <canvas id="metricsChart" class="w-full max-w-3xl mt-6"></canvas>
      `;

      const metricsContainer = document.getElementById("metricsContent");
      const planFilterEl = document.getElementById("planFilter");

      const renderMetrics = async () => {
        const selectedPlan = planFilterEl.value;
        const filteredUserIDs = users
          .filter(u => selectedPlan === "all" || (u.plan || "free") === selectedPlan)
          .map(u => u.id);

        const { data: logs, error: logsErr } = await supabase
          .from("generation_logs")
          .select("user_id, type, credits_used, created_at")
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false });
        if (logsErr) throw logsErr;

        let totalEbooks = 0;
        let totalRegens = 0;
        let totalCredits = 0;
        let creditTypeBreakdown = {};
        let userUsage = {};
        const dailyBreakdown = {};

        for (let log of logs) {
          if (!filteredUserIDs.includes(log.user_id)) continue;

          const dateKey = new Date(log.created_at).toISOString().split("T")[0];
          dailyBreakdown[dateKey] = dailyBreakdown[dateKey] || { credits: 0, ebooks: 0, regens: 0 };

          totalCredits += log.credits_used || 0;
          dailyBreakdown[dateKey].credits += log.credits_used || 0;

          const typeKey = log.type || "unknown";
          creditTypeBreakdown[typeKey] = (creditTypeBreakdown[typeKey] || 0) + (log.credits_used || 0);

          userUsage[log.user_id] = (userUsage[log.user_id] || 0) + (log.credits_used || 0);

          if (log.type === "generate") {
            totalEbooks += 1;
            dailyBreakdown[dateKey].ebooks += 1;
          } else if (log.type.startsWith("regen_")) {
            totalRegens += 1;
            dailyBreakdown[dateKey].regens += 1;
          }
        }

        const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => a.localeCompare(b)).slice(-7);
        const topCreditTypes = Object.entries(creditTypeBreakdown).sort((a, b) => b[1] - a[1]);
        const topUsers = Object.entries(userUsage).sort((a, b) => b[1] - a[1]).slice(0, 5);

        metricsContainer.innerHTML = `
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-sm">
            <div class="bg-white dark:bg-gray-900 border rounded p-4 shadow">
              <p class="text-gray-500">👥 Total Users</p>
              <p class="text-xl font-semibold">${filteredUserIDs.length.toLocaleString()}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 border rounded p-4 shadow">
              <p class="text-gray-500">📚 eBooks Generated</p>
              <p class="text-xl font-semibold">${totalEbooks.toLocaleString()}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 border rounded p-4 shadow">
              <p class="text-gray-500">🔁 Regenerations</p>
              <p class="text-xl font-semibold">${totalRegens.toLocaleString()}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 border rounded p-4 shadow">
              <p class="text-gray-500">💳 Total Credits Used</p>
              <p class="text-xl font-semibold">${totalCredits.toLocaleString()}</p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6 mb-8 text-sm">
            <div class="bg-white dark:bg-gray-900 border rounded p-4">
              <p class="text-lg mb-2 font-semibold">📊 Top Credit Usage by Type</p>
              <ul class="list-disc list-inside">
                ${topCreditTypes.map(([type, amount]) => `<li><code>${type}</code>: ${amount} credits</li>`).join("")}
              </ul>
            </div>
            <div class="bg-white dark:bg-gray-900 border rounded p-4">
              <p class="text-lg mb-2 font-semibold">🏆 Top 5 Users by Credits</p>
              <ul class="list-decimal list-inside">
                ${topUsers.map(([userId, total]) => {
                  const email = users.find(u => u.id === userId)?.email || userId;
                  return `<li>${email}: ${total} credits</li>`;
                }).join("")}
              </ul>
            </div>
          </div>

          <div class="overflow-auto border rounded">
            <table class="w-full text-sm table-auto">
              <thead class="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th class="p-2 text-left">📅 Date</th>
                  <th class="p-2 text-left">💳 Credits</th>
                  <th class="p-2 text-left">📚 eBooks</th>
                  <th class="p-2 text-left">🔁 Regens</th>
                </tr>
              </thead>
              <tbody class="divide-y dark:divide-gray-700">
                ${sortedDates.map(date => `
                  <tr>
                    <td class="p-2 font-mono">${date}</td>
                    <td class="p-2">${dailyBreakdown[date].credits}</td>
                    <td class="p-2">${dailyBreakdown[date].ebooks}</td>
                    <td class="p-2">${dailyBreakdown[date].regens}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;

        // 📈 Chart.js (optional, simple line chart)
        const ctx = document.getElementById("metricsChart").getContext("2d");
        new Chart(ctx, {
          type: "line",
          data: {
            labels: sortedDates,
            datasets: [
              {
                label: "Credits Used",
                data: sortedDates.map(d => dailyBreakdown[d].credits),
                borderColor: "#3b82f6",
                fill: false
              },
              {
                label: "eBooks",
                data: sortedDates.map(d => dailyBreakdown[d].ebooks),
                borderColor: "#10b981",
                fill: false
              },
              {
                label: "Regens",
                data: sortedDates.map(d => dailyBreakdown[d].regens),
                borderColor: "#f59e0b",
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "top" } }
          }
        });
      };

      planFilterEl.addEventListener("change", renderMetrics);
      renderMetrics();

      // 📁 Export CSV
      document.getElementById("exportMetricsCSV").addEventListener("click", () => {
        const csv = [
          ["Date", "Credits", "eBooks", "Regens"],
          ...Object.entries(dailyBreakdown).map(([date, vals]) => [
            date, vals.credits, vals.ebooks, vals.regens
          ])
        ].map(r => r.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `launchbook_metrics.csv`;
        link.click();
      });
    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading metrics: ${err.message}</p>`;
    }
  }
};
