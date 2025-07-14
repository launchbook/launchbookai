window.AdminModules = window.AdminModules || {};
window.AdminModules["settings"] = {
  init: async function (container) {
    const supabase = window.supabase;
    const user = (await supabase.auth.getUser()).data.user;
    container.innerHTML = `<p class="text-sm text-gray-600 mb-4">Loading system settings...</p>`;

    try {
      const DEFAULTS = {
        "CREDIT_COSTS.generate": "1000",
        "CREDIT_COSTS.regen_text": "300",
        "CREDIT_COSTS.regen_image": "400",
        "CREDIT_COSTS.regen_cover": "500",
        "CREDIT_COSTS.send_email": "200",
        "PLAN.startup.credits": "5000",
        "PLAN.growth.credits": "12500",
        "PLAN.pro.credits": "25000",
        "PLAN.agency.credits": "50000",
        "PLAN.startup.name": "Starter",
        "PLAN.growth.name": "Growth",
        "PLAN.pro.name": "Pro",
        "PLAN.agency.name": "Agency",
        "PLAN.startup.badge": "",
        "PLAN.growth.badge": "Best Value",
        "PLAN.pro.badge": "",
        "PLAN.agency.badge": "Agency Only",
        "ALERTS.daily_credit_threshold": "50000",
        "AUTO_BLOCK.enabled": "true",
        "AUTO_BLOCK.daily_credit_limit": "100000"
      };

      const settingFields = Object.keys(DEFAULTS).map(key => ({
        key,
        label: key.includes("badge") ? `🏷 ${key.replace("PLAN.", "").replace(".badge", "")} Plan Badge Label` :
               key.includes("name") ? `📝 ${key.replace("PLAN.", "").replace(".name", "")} Plan Name` :
               key.includes("credits") ? `💳 ${key.replace("PLAN.", "").replace(".credits", "")} Plan Monthly Credits` :
               key.includes("ALERTS") ? `⚠️ Daily Credit Spike Threshold` :
               key.includes("AUTO_BLOCK") ? `🛑 ${key.split(".").pop().replace(/_/g, " ")}` :
               key.replace("CREDIT_COSTS.", "").replace(/_/g, " ").toUpperCase()
      }));

      const toggleFields = [
        { key: "FEATURE.email_enabled", label: "✅ Email Sending Enabled" },
        { key: "FEATURE.free_tier_enabled", label: "✅ Free Tier Enabled" },
        { key: "FEATURE.cover_regen_enabled", label: "✅ Cover Regeneration Enabled" }
      ];

      const { data: settingsData, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .order("key", { ascending: true });

      if (error) throw error;

      const settingsMap = {};
      settingsData.forEach(row => settingsMap[row.key] = row.value);

      container.innerHTML = `
        <form id="settingsForm" class="space-y-6">
          <h2 class="text-lg font-semibold mb-2">💳 Credit & Plan Settings</h2>
          ${settingFields.map(field => `
            <div>
              <label class="block text-sm font-medium mb-1">${field.label}</label>
              <div class="flex gap-2 items-center">
                <input type="text" name="${field.key}" value="${settingsMap[field.key] || ''}" class="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" />
                <button data-reset="${field.key}" type="button" class="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Reset</button>
              </div>
            </div>
          `).join("")}

          <h2 class="text-lg font-semibold mt-8 mb-2">⚙️ Feature Toggles</h2>
          ${toggleFields.map(field => `
            <div class="flex items-center gap-3">
              <input type="checkbox" name="${field.key}" id="${field.key}" ${settingsMap[field.key] === 'true' ? 'checked' : ''} />
              <label for="${field.key}" class="text-sm">${field.label}</label>
            </div>
          `).join("")}

          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">💾 Save Settings</button>
        </form>

        <div class="mt-6">
          <label class="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" id="darkModeToggle" />
            🌙 Preview in Dark Mode
          </label>
        </div>

        <div id="liveWarnings" class="mt-6 text-sm text-orange-600"></div>

        <hr class="my-6" />
        <button id="sendTestEmail" class="text-blue-600 underline text-sm">📧 Send Test Email</button>
        <p id="testEmailResult" class="text-xs mt-2 text-gray-500"></p>

        <details class="mt-6">
          <summary class="text-sm font-medium cursor-pointer">🕓 View Settings Change Logs</summary>
          <div id="settingsLogs" class="text-xs mt-4 text-gray-500">Loading logs...</div>
        </details>
      `;

      // Save logic
      document.getElementById("settingsForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const updates = [];
        for (const el of e.target.elements) {
          if (!el.name) continue;
          const value = el.type === "checkbox" ? el.checked.toString() : el.value;
          updates.push({ key: el.name, value });
        }

        for (const item of updates) {
          await supabase.from("system_settings").upsert(item, { onConflict: ["key"] });
          await supabase.from("settings_logs").insert({ key: item.key, new_value: item.value });
        }

        alert("✅ Settings saved.");
      });

      // Reset button logic
      container.querySelectorAll("button[data-reset]").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.reset;
          const input = container.querySelector(`[name="${key}"]`);
          if (input && DEFAULTS[key]) input.value = DEFAULTS[key];
        });
      });

      // Dark mode toggle
      document.getElementById("darkModeToggle").addEventListener("change", (e) => {
        document.documentElement.classList.toggle("dark", e.target.checked);
      });

      // Warnings & Logs
      const warn = [];
      if (parseInt(settingsMap["CREDIT_COSTS.generate"] || "0") < 500)
        warn.push(`⚠️ Generate cost is low: ${settingsMap["CREDIT_COSTS.generate"]}`);
      if (parseInt(settingsMap["PLAN.agency.credits"] || "0") < 30000)
        warn.push(`⚠️ Agency credits too low`);

      const spikeThreshold = parseInt(settingsMap["ALERTS.daily_credit_threshold"] || "50000");
      const { data: logs } = await supabase
        .from("generation_logs")
        .select("user_id, credits_used, created_at")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

      const dayCredits = {};
      logs.forEach(log => {
        const day = new Date(log.created_at).toISOString().split("T")[0];
        dayCredits[day] = (dayCredits[day] || 0) + (log.credits_used || 0);
      });

      Object.entries(dayCredits).forEach(([day, total]) => {
        if (total > spikeThreshold)
          warn.push(`⚠️ Spike: ${total} credits used on ${day}`);
      });

      // Auto-block logic
      if (settingsMap["AUTO_BLOCK.enabled"] === "true") {
        const limit = parseInt(settingsMap["AUTO_BLOCK.daily_credit_limit"] || "100000");
        const userDailyUsage = {};

        logs.forEach(log => {
          const date = new Date(log.created_at).toISOString().split("T")[0];
          const userId = log.user_id;
          if (!userId) return;

          userDailyUsage[userId] = userDailyUsage[userId] || {};
          userDailyUsage[userId][date] = (userDailyUsage[userId][date] || 0) + (log.credits_used || 0);
        });

        for (const userId in userDailyUsage) {
          for (const date in userDailyUsage[userId]) {
            if (userDailyUsage[userId][date] > limit) {
              await supabase.from("users").update({ blocked: true }).eq("id", userId);
              await supabase.from("blocked_logs").insert({
                user_id: userId,
                reason: `Exceeded ${limit} credits on ${date}`,
                triggered_by: "auto"
              });
              warn.push(`🚫 Auto-blocked user ${userId} for using ${userDailyUsage[userId][date]} credits on ${date}`);
            }
          }
        }
      }

      if (warn.length) {
        document.getElementById("liveWarnings").innerHTML = `
          <div class="border-l-4 border-orange-400 bg-orange-100 p-3 dark:bg-gray-900">${warn.join("<br>")}</div>
        `;
      }

      // Send test email
      document.getElementById("sendTestEmail").addEventListener("click", async () => {
        const resultEl = document.getElementById("testEmailResult");
        resultEl.textContent = "Sending...";

        const { error } = await supabase.functions.invoke("send_test_email", {
          body: { email: user.email }
        });

        resultEl.textContent = error
          ? `❌ Failed: ${error.message}`
          : `✅ Test email sent to ${user.email}`;
      });

      // Settings change logs
      const { data: logsData } = await supabase
        .from("settings_logs")
        .select("created_at, key, new_value")
        .order("created_at", { ascending: false })
        .limit(25);

      if (logsData?.length) {
        document.getElementById("settingsLogs").innerHTML = `
          <ul class="list-disc ml-4 space-y-1">
            ${logsData.map(log => `
              <li><code>${log.key}</code> → <strong>${log.new_value}</strong> at ${new Date(log.created_at).toLocaleString()}</li>
            `).join("")}
          </ul>
        `;
      } else {
        document.getElementById("settingsLogs").textContent = "No recent changes found.";
      }

    } catch (err) {
      container.innerHTML = `<p class="text-red-600 text-sm">❌ Error loading settings: ${err.message}</p>`;
    }
  }
};
