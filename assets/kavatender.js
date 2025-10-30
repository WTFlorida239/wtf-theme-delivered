(function() {
  const root = document.getElementById('kavatender-root');
  const panel = document.getElementById('kavatender-panel');
  const launcher = document.getElementById('kavatender-launcher');
  const closeBtn = document.getElementById('kavatender-close');
  const form = document.getElementById('kavatender-form');
  const input = document.getElementById('kavatender-input');
  const messages = document.getElementById('kavatender-messages');

  function show() { panel.style.display = 'grid'; setTimeout(()=>input.focus(), 50); }
  function hide() { panel.style.display = 'none'; }
  function addMsg(text, who='bot') {
    const div = document.createElement('div');
    div.className = `kava-msg ${who}`;
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  function addCard(html) {
    const wrap = document.createElement('div');
    wrap.className = 'kava-card';
    wrap.innerHTML = html;
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  launcher?.addEventListener('click', show);
  closeBtn?.addEventListener('click', hide);

  // FIRST LOAD
  window.addEventListener('load', () => {
    root.classList.remove('kava-hidden');
    addMsg("Hey! I’m your Virtual Kavatender. Want calm, focus, or euphoria? Tell me what you’re in the mood for.");
  });

  // STREAM via SSE
  async function streamChat(userText) {
    addMsg(userText, 'user');

    const resp = await fetch('/apps/kavatender/chat', { // or your serverless URL
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message: userText, cartId: window?.__WTF_CART_ID || null })
    });

    if (!resp.ok || !resp.body) { addMsg('Sorry, I’m having trouble right now.'); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let botDiv = document.createElement('div');
    botDiv.className = 'kava-msg bot';
    messages.appendChild(botDiv);

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, {stream:true});
      botDiv.textContent += chunk;
      messages.scrollTop = messages.scrollHeight;
    }
  }

  // Add-to-cart from cards
  messages.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-add-variant]');
    if (!btn) return;
    const variantId = btn.getAttribute('data-add-variant');
    btn.disabled = true;

    const res = await fetch('/apps/kavatender/cart', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ variantId, quantity: 1, cartId: window.__WTF_CART_ID || null })
    }).then(r => r.json()).catch(()=>null);

    if (res && res.cartUrl) {
      addCard(`Added! <a href="${res.cartUrl}">Open cart</a> or keep browsing.`);
      window.__WTF_CART_ID = res.cartId || window.__WTF_CART_ID;
    } else {
      addMsg('Could not add to cart. Try again or use the product page.');
    }
    btn.disabled = false;
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    streamChat(text);
  });
})();
