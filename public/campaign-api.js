(() => {
  const api = {
    async request(url, options = {}) {
      const csrf = window.MarketingHubAuth?.getCsrf ? await window.MarketingHubAuth.getCsrf() : '';
      const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
          ...(options.headers || {})
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
      return data;
    },

    toUi(c) {
      return {
        id: String(c.id),
        name: c.name,
        platform: c.platform,
        objective: c.objective,
        budget: Number(c.budget) || 0,
        spent: Number(c.spent) || 0,
        sales: Number(c.sales) || 0,
        queries: Number(c.leads) || 0,
        status: c.status === 'active' ? 'Activa' : c.status === 'paused' ? 'Pausada' : c.status === 'completed' ? 'Finalizada' : (c.status || 'Activa'),
        start_date: c.start_date,
        end_date: c.end_date
      };
    },

    async load() {
      if (!document.getElementById('app-shell') && !localStorage.getItem('mh_session')) return false;
      try {
        const data = await this.request('/api/campaigns');
        if (typeof DB === 'undefined') return false;
        DB.campaigns = (data.campaigns || []).map(this.toUi);
        saveDB();
        if (typeof render === 'function') render();
        return true;
      } catch (error) {
        console.warn('Campaign API unavailable:', error.message);
        return false;
      }
    },

    async create(payload) {
      const data = await this.request('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return this.toUi(data.campaign);
    },

    async update(id, payload) {
      const data = await this.request(`/api/campaigns/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return this.toUi(data.campaign);
    },

    async remove(id) {
      await this.request(`/api/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }
  };

  function showCampaignError(message) {
    const existing = document.getElementById('mh-campaign-error');
    if (existing) existing.remove();
    const modalBody = document.querySelector('#modal-overlay .modal-body');
    if (!modalBody) return;
    const el = document.createElement('div');
    el.id = 'mh-campaign-error';
    el.className = 'alert';
    el.style.cssText = 'margin-top:12px;border-color:#F5C6C8;background:#FDEAEB;color:#A52B31;';
    el.textContent = message;
    modalBody.appendChild(el);
  }

  // Replace the demo-only modal with the real API-backed version.
  window.campaignModal = async function campaignModal(id) {
    const existing = id ? DB.campaigns.find(x => String(x.id) === String(id)) : null;
    openModal(existing ? 'Editar campaña' : 'Nueva campaña', `
      <form id="campaign-form">
        <div class="form-grid">
          <div class="field"><label>Nombre</label><input name="name" required value="${esc(existing?.name || '')}" placeholder="Ej. Promo septiembre"></div>
          <div class="field"><label>Plataforma</label><select name="platform">
            <option ${existing?.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
            <option ${existing?.platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
            <option ${existing?.platform === 'Google' ? 'selected' : ''}>Google</option>
          </select></div>
          <div class="field"><label>Objetivo</label><select name="objective">
            <option ${existing?.objective === 'Ventas' ? 'selected' : ''}>Ventas</option>
            <option ${existing?.objective === 'Alcance' ? 'selected' : ''}>Alcance</option>
            <option ${existing?.objective === 'Consultas' ? 'selected' : ''}>Consultas</option>
          </select></div>
          <div class="field"><label>Presupuesto</label><input type="number" name="budget" min="0" step="0.01" required value="${existing?.budget ?? ''}"></div>
          <div class="field"><label>Inicio</label><input type="date" name="start_date" value="${existing?.start_date || ''}"></div>
          <div class="field"><label>Fin</label><input type="date" name="end_date" value="${existing?.end_date || ''}"></div>
        </div>
      </form>`,
      '<button class="btn secondary" id="cancel-modal">Cancelar</button><button class="btn primary" id="save-campaign">Guardar campaña</button>'
    );

    document.getElementById('cancel-modal').onclick = closeModal;
    document.getElementById('save-campaign').onclick = async () => {
      const button = document.getElementById('save-campaign');
      const form = document.getElementById('campaign-form');
      if (!form.reportValidity()) return;
      const f = new FormData(form);
      const payload = {
        name: String(f.get('name')).trim(),
        platform: f.get('platform'),
        objective: f.get('objective'),
        budget: Number(f.get('budget')),
        start_date: f.get('start_date') || null,
        end_date: f.get('end_date') || null
      };
      button.disabled = true;
      button.textContent = 'Guardando…';
      try {
        const saved = existing ? await api.update(existing.id, payload) : await api.create(payload);
        if (existing) {
          const index = DB.campaigns.findIndex(x => String(x.id) === String(existing.id));
          if (index >= 0) DB.campaigns[index] = saved;
        } else {
          DB.campaigns.unshift(saved);
        }
        saveDB();
        closeModal();
        render();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Guardar campaña';
        showCampaignError(error.message);
      }
    };
  };

  // Capture edit/delete clicks before the legacy localStorage handlers run.
  document.addEventListener('click', async event => {
    const edit = event.target.closest?.('[data-edit-campaign]');
    const remove = event.target.closest?.('[data-delete-campaign]');
    if (!edit && !remove) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (edit) {
      window.campaignModal(edit.dataset.editCampaign);
      return;
    }

    if (remove) {
      const id = remove.dataset.deleteCampaign;
      const campaign = DB.campaigns.find(c => String(c.id) === String(id));
      if (!campaign || !confirm(`¿Eliminar la campaña “${campaign.name}”?`)) return;
      try {
        remove.disabled = true;
        await api.remove(id);
        DB.campaigns = DB.campaigns.filter(c => String(c.id) !== String(id));
        saveDB();
        render();
      } catch (error) {
        alert(error.message);
      }
    }
  }, true);

  window.MarketingHubCampaigns = api;

  // Wait for the authenticated app shell to initialize, then hydrate campaigns from PostgreSQL.
  let attempts = 0;
  const hydrate = async () => {
    attempts += 1;
    if (typeof DB !== 'undefined' && (localStorage.getItem('mh_session') || document.getElementById('app-shell'))) {
      await api.load();
      return;
    }
    if (attempts < 80) setTimeout(hydrate, 250);
  };
  hydrate();
})();
