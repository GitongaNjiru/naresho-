// ====== STATE ======
let content = {};
let currentSection = 'hero';

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  checkAuth();
});

// ====== AUTH ======
async function checkAuth() {
  try {
    const res = await fetch('/api/auth-check');
    const data = await res.json();
    if (data.authenticated) showDashboard();
    else showLogin();
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  loadContent();
}

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      showDashboard();
    } else {
      errorEl.textContent = 'Invalid username or password';
    }
  } catch {
    errorEl.textContent = 'Connection error. Is the server running?';
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showLogin();
});

// ====== LOAD CONTENT ======
async function loadContent() {
  try {
    const res = await fetch('/api/admin/content');
    content = await res.json();
    renderSection(currentSection);
  } catch (err) {
    showToast('Failed to load content', 'error');
  }
}

// ====== NAV BUTTONS ======
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSection = btn.dataset.section;
    document.getElementById('pageTitle').textContent = btn.textContent.trim();
    renderSection(currentSection);
  });
});

// ====== SAVE BUTTON ======
document.getElementById('saveBtn').addEventListener('click', saveSection);

async function saveSection() {
  // Collect form data based on current section
  const sectionData = collectFormData();
  if (!sectionData) return;

  // Settings section maps to the "site" key in content JSON
  const apiSection = currentSection === 'settings' ? 'site' : currentSection;

  try {
    const res = await fetch(`/api/admin/content/${apiSection}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sectionData)
    });
    if (res.ok) {
      const data = await res.json();
      content[apiSection] = data.content;
      showToast('Changes saved successfully!');
    } else {
      showToast('Failed to save', 'error');
    }
  } catch {
    showToast('Connection error', 'error');
  }
}

// ====== RENDER SECTION ======
function renderSection(section) {
  const area = document.getElementById('contentArea');
  
  switch(section) {
    case 'hero': renderHero(area); break;
    case 'about': renderAbout(area); break;
    case 'project': renderProject(area); break;
    case 'structure': renderStructure(area); break;
    case 'timeline': renderTimeline(area); break;
    case 'why': renderWhy(area); break;
    case 'contact': renderContact(area); break;
    case 'footer': renderFooter(area); break;
    case 'blog': renderBlog(area); break;
    case 'gallery': renderGallery(area); break;
    case 'team': renderTeam(area); break;
    case 'settings': renderSettings(area); break;
  }
  lucide.createIcons();
}

// ====== HELPERS ======
function field(labelText, id, value, type='text', hint='') {
  return `
    <div class="field">
      <label>${labelText}</label>
      <input type="${type}" id="${id}" value="${escapeHtml(value)}" />
      ${hint ? `<div class="hint">${hint}</div>` : ''}
    </div>`;
}

function textareaField(labelText, id, value, hint='') {
  return `
    <div class="field">
      <label>${labelText}</label>
      <textarea id="${id}">${escapeHtml(value)}</textarea>
      ${hint ? `<div class="hint">${hint}</div>` : ''}
    </div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type='success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + (type === 'error' ? 'error' : '');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ====== HERO ======
function renderHero(area) {
  const h = content.hero;
  let statsHtml = '<div class="field-group"><h3>Hero Stats</h3>';
  h.stats.forEach((s, i) => {
    statsHtml += `
      <div class="list-item">
        <div class="list-item-header">
          <span>Stat ${i+1}</span>
          <button class="btn-icon btn-delete" onclick="removeStat(${i})"><i data-lucide="trash-2"></i></button>
        </div>
        <div class="field-row-3">
          <div class="field"><label>Number</label><input type="text" id="hero-stat-num-${i}" value="${escapeHtml(s.num)}" /></div>
          <div class="field"><label>Unit</label><input type="text" id="hero-stat-unit-${i}" value="${escapeHtml(s.unit)}" /></div>
          <div class="field"><label>Label</label><input type="text" id="hero-stat-label-${i}" value="${escapeHtml(s.label)}" /></div>
        </div>
      </div>`;
  });
  statsHtml += '<button class="btn-add" onclick="addStat()"><i data-lucide="plus"></i> Add Stat</button></div>';

  area.innerHTML = `
    <div class="field-group">
      <h3>Hero Content</h3>
      ${field('Badge Text', 'hero-badge', h.badge)}
      ${field('Heading', 'hero-heading', h.heading)}
      ${field('Highlight Word', 'hero-highlight', h.headingHighlight, 'text', 'This word appears in gradient color')}
      ${textareaField('Subheading', 'hero-subheading', h.subheading)}
      <div class="field-row">
        ${field('Primary Button Text', 'hero-btn1', h.btnPrimary)}
        ${field('Primary Button Link', 'hero-btn1-link', h.btnPrimaryLink)}
      </div>
      <div class="field-row">
        ${field('Secondary Button Text', 'hero-btn2', h.btnSecondary)}
        ${field('Secondary Button Link', 'hero-btn2-link', h.btnSecondaryLink)}
      </div>
    </div>
    ${statsHtml}
  `;
}

function addStat() {
  content.hero.stats.push({ num: '', unit: '', label: '' });
  renderSection('hero');
}
function removeStat(i) {
  content.hero.stats.splice(i, 1);
  renderSection('hero');
}

// ====== ABOUT ======
function renderAbout(area) {
  const a = content.about;
  let parasHtml = '<div class="field-group"><h3>Paragraphs</h3>';
  a.paragraphs.forEach((p, i) => {
    parasHtml += `
      <div class="list-item">
        <div class="list-item-header">
          <span>Paragraph ${i+1}</span>
          <button class="btn-icon btn-delete" onclick="removeAboutPara(${i})"><i data-lucide="trash-2"></i></button>
        </div>
        ${textareaField('', `about-para-${i}`, p)}
      </div>`;
  });
  parasHtml += '<button class="btn-add" onclick="addAboutPara()"><i data-lucide="plus"></i> Add Paragraph</button></div>';

  let certsHtml = '<div class="field-group"><h3>Certifications</h3>';
  a.certs.forEach((c, i) => {
    certsHtml += `
      <div class="list-item">
        <div class="list-item-header">
          <span>Cert ${i+1}</span>
          <button class="btn-icon btn-delete" onclick="removeCert(${i})"><i data-lucide="trash-2"></i></button>
        </div>
        ${field('Text', `about-cert-${i}`, c)}
      </div>`;
  });
  certsHtml += '<button class="btn-add" onclick="addCert()"><i data-lucide="plus"></i> Add Certification</button></div>';

  let cardsHtml = '<div class="field-group"><h3>About Cards</h3>';
  a.cards.forEach((c, i) => {
    cardsHtml += `
      <div class="list-item">
        <div class="list-item-header">
          <span>Card ${i+1}</span>
          <button class="btn-icon btn-delete" onclick="removeAboutCard(${i})"><i data-lucide="trash-2"></i></button>
        </div>
        <div class="field-row">
          ${field('Icon (Lucide name)', `about-card-icon-${i}`, c.icon, 'text', 'e.g. map-pin, zap, building-2')}
          ${field('Title', `about-card-title-${i}`, c.title)}
        </div>
        ${textareaField('Text', `about-card-text-${i}`, c.text)}
      </div>`;
  });
  cardsHtml += '<button class="btn-add" onclick="addAboutCard()"><i data-lucide="plus"></i> Add Card</button></div>';

  area.innerHTML = `
    <div class="field-group">
      <h3>About Header</h3>
      ${field('Tag', 'about-tag', a.tag)}
      ${field('Heading', 'about-heading', a.heading)}
    </div>
    ${parasHtml}
    ${certsHtml}
    ${cardsHtml}
  `;
}
function addAboutPara() { content.about.paragraphs.push(''); renderSection('about'); }
function removeAboutPara(i) { content.about.paragraphs.splice(i,1); renderSection('about'); }
function addCert() { content.about.certs.push(''); renderSection('about'); }
function removeCert(i) { content.about.certs.splice(i,1); renderSection('about'); }
function addAboutCard() { content.about.cards.push({icon:'',title:'',text:''}); renderSection('about'); }
function removeAboutCard(i) { content.about.cards.splice(i,1); renderSection('about'); }

// ====== PROJECT ======
function renderProject(area) {
  const p = content.project;
  let factsHtml = '<div class="field-group"><h3>Project Facts</h3>';
  p.facts.forEach((f, i) => {
    factsHtml += `
      <div class="list-item">
        <div class="list-item-header"><span>Fact ${i+1}</span><button class="btn-icon btn-delete" onclick="removeFact(${i})"><i data-lucide="trash-2"></i></button></div>
        <div class="field-row-3">
          ${field('Icon', `proj-fact-icon-${i}`, f.icon)}
          ${field('Label', `proj-fact-label-${i}`, f.label)}
          ${field('Value', `proj-fact-value-${i}`, f.value)}
        </div>
      </div>`;
  });
  factsHtml += '<button class="btn-add" onclick="addFact()"><i data-lucide="plus"></i> Add Fact</button></div>';

  let detailsHtml = '<div class="field-group"><h3>Project Details</h3>';
  p.details.forEach((d, i) => {
    detailsHtml += `
      <div class="list-item">
        <div class="list-item-header"><span>Detail ${i+1}</span><button class="btn-icon btn-delete" onclick="removeDetail(${i})"><i data-lucide="trash-2"></i></button></div>
        ${field('Icon', `proj-detail-icon-${i}`, d.icon)}
        ${field('Title', `proj-detail-title-${i}`, d.title)}
        ${textareaField('Text', `proj-detail-text-${i}`, d.text)}
      </div>`;
  });
  detailsHtml += '<button class="btn-add" onclick="addDetail()"><i data-lucide="plus"></i> Add Detail</button></div>';

  let advisorsHtml = '<div class="field-group"><h3>Advisory Team</h3>';
  p.advisors.list.forEach((a, i) => {
    advisorsHtml += `
      <div class="list-item">
        <div class="list-item-header"><span>Advisor ${i+1}</span><button class="btn-icon btn-delete" onclick="removeAdvisor(${i})"><i data-lucide="trash-2"></i></button></div>
        <div class="field-row">
          ${field('Role', `proj-adv-role-${i}`, a.role)}
          ${field('Name', `proj-adv-name-${i}`, a.name)}
        </div>
      </div>`;
  });
  advisorsHtml += '<button class="btn-add" onclick="addAdvisor()"><i data-lucide="plus"></i> Add Advisor</button></div>';

  area.innerHTML = `
    <div class="field-group">
      <h3>Project Header</h3>
      ${field('Tag', 'proj-tag', p.tag)}
      ${field('Heading', 'proj-heading', p.heading)}
      ${textareaField('Description', 'proj-desc', p.desc)}
      ${field('Sub Heading', 'proj-subheading', p.subHeading)}
    </div>
    ${factsHtml}
    ${detailsHtml}
    <div class="field-group"><h3>Sponsor</h3>
      ${field('Badge', 'proj-sponsor-badge', p.sponsor.badge)}
      ${field('Name', 'proj-sponsor-name', p.sponsor.name)}
      ${textareaField('Detail', 'proj-sponsor-detail', p.sponsor.detail)}
    </div>
    <div class="field-group"><h3>Opportunity</h3>
      ${field('Title', 'proj-opp-title', p.opportunity.title)}
      ${textareaField('Text', 'proj-opp-text', p.opportunity.text)}
    </div>
    ${advisorsHtml}
    <div class="field-group"><h3>Kenya Context</h3>
      ${field('Title', 'proj-kenya-title', p.kenyaContext.title)}
      ${textareaField('Text', 'proj-kenya-text', p.kenyaContext.text)}
    </div>
  `;
}
function addFact() { content.project.facts.push({icon:'',label:'',value:''}); renderSection('project'); }
function removeFact(i) { content.project.facts.splice(i,1); renderSection('project'); }
function addDetail() { content.project.details.push({icon:'',title:'',text:''}); renderSection('project'); }
function removeDetail(i) { content.project.details.splice(i,1); renderSection('project'); }
function addAdvisor() { content.project.advisors.list.push({role:'',name:''}); renderSection('project'); }
function removeAdvisor(i) { content.project.advisors.list.splice(i,1); renderSection('project'); }

// ====== STRUCTURE ======
function renderStructure(area) {
  const s = content.structure;
  let levelsHtml = '<div class="field-group"><h3>Structure Levels</h3>';
  s.levels.forEach((lv, i) => {
    if (lv.box) {
      levelsHtml += `
        <div class="list-item">
          <div class="list-item-header"><span>Level ${i+1}</span></div>
          ${field('Icon', `struct-icon-${i}`, lv.box.icon)}
          ${field('Title', `struct-title-${i}`, lv.box.title)}
          ${lv.box.badge !== undefined ? field('Badge (optional)', `struct-badge-${i}`, lv.box.badge || '') : ''}
          ${textareaField('Description', `struct-desc-${i}`, lv.box.desc)}
        </div>`;
    } else if (lv.split) {
      lv.boxes.forEach((b, j) => {
        levelsHtml += `
          <div class="list-item">
            <div class="list-item-header"><span>Level ${i+1}.${j+1} (Split)</span></div>
            ${field('Icon', `struct-split-icon-${i}-${j}`, b.icon)}
            ${field('Title', `struct-split-title-${i}-${j}`, b.title)}
            ${textareaField('Description', `struct-split-desc-${i}-${j}`, b.desc)}
          </div>`;
      });
    }
  });
  levelsHtml += '</div>';

  area.innerHTML = `
    <div class="field-group"><h3>Section Header</h3>
      ${field('Tag', 'struct-tag', s.tag)}
      ${field('Heading', 'struct-heading', s.heading)}
      ${textareaField('Description', 'struct-desc', s.desc)}
    </div>
    ${levelsHtml}
  `;
}

// ====== TIMELINE ======
function renderTimeline(area) {
  const t = content.timeline;
  let itemsHtml = '<div class="field-group"><h3>Timeline Phases</h3>';
  t.items.forEach((item, i) => {
    let subItems = item.items.map((si, j) => `<div class="field"><input type="text" id="tl-item-${i}-sub-${j}" value="${escapeHtml(si)}" /></div>`).join('');
    itemsHtml += `
      <div class="list-item">
        <div class="list-item-header"><span>${item.phase}</span><button class="btn-icon btn-delete" onclick="removeTimelineItem(${i})"><i data-lucide="trash-2"></i></button></div>
        ${field('Phase Label', `tl-phase-${i}`, item.phase)}
        ${field('Title', `tl-title-${i}`, item.title)}
        <div class="field"><label><input type="checkbox" id="tl-active-${i}" ${item.active ? 'checked' : ''} /> &nbsp;This is the current/active phase</label></div>
        <div class="field"><label>Sub-items</label>${subItems}</div>
      </div>`;
  });
  itemsHtml += '<button class="btn-add" onclick="addTimelineItem()"><i data-lucide="plus"></i> Add Phase</button></div>';

  area.innerHTML = `
    <div class="field-group"><h3>Section Header</h3>
      ${field('Tag', 'tl-tag', t.tag)}
      ${field('Heading', 'tl-heading', t.heading)}
      ${textareaField('Description', 'tl-desc', t.desc)}
    </div>
    ${itemsHtml}
  `;
}
function addTimelineItem() { content.timeline.items.push({phase:'',title:'',active:false,items:['']}); renderSection('timeline'); }
function removeTimelineItem(i) { content.timeline.items.splice(i,1); renderSection('timeline'); }

// ====== WHY INVEST ======
function renderWhy(area) {
  const w = content.why;
  let cardsHtml = '<div class="field-group"><h3>Investment Cards</h3>';
  w.cards.forEach((c, i) => {
    cardsHtml += `
      <div class="list-item">
        <div class="list-item-header"><span>Card ${i+1}</span><button class="btn-icon btn-delete" onclick="removeWhyCard(${i})"><i data-lucide="trash-2"></i></button></div>
        <div class="field-row-3">
          ${field('Number', `why-num-${i}`, c.num)}
          ${field('Icon', `why-icon-${i}`, c.icon)}
          ${field('Title', `why-title-${i}`, c.title)}
        </div>
        ${textareaField('Text', `why-text-${i}`, c.text)}
      </div>`;
  });
  cardsHtml += '<button class="btn-add" onclick="addWhyCard()"><i data-lucide="plus"></i> Add Card</button></div>';

  area.innerHTML = `
    <div class="field-group"><h3>Section Header</h3>
      ${field('Tag', 'why-tag', w.tag)}
      ${field('Heading', 'why-heading', w.heading)}
      ${textareaField('Description', 'why-desc', w.desc)}
    </div>
    ${cardsHtml}
    <div class="field-group"><h3>Call to Action</h3>
      ${field('Heading', 'why-cta-heading', w.cta.heading)}
      ${textareaField('Text', 'why-cta-text', w.cta.text)}
      <div class="field-row">
        ${field('Button Text', 'why-cta-btn', w.cta.btnText)}
        ${field('Button Link', 'why-cta-link', w.cta.btnLink)}
      </div>
    </div>
  `;
}
function addWhyCard() { content.why.cards.push({num:'',icon:'',title:'',text:''}); renderSection('why'); }
function removeWhyCard(i) { content.why.cards.splice(i,1); renderSection('why'); }

// ====== CONTACT ======
function renderContact(area) {
  const c = content.contact;
  let itemsHtml = '<div class="field-group"><h3>Contact Items</h3>';
  c.items.forEach((item, i) => {
    itemsHtml += `
      <div class="list-item">
        <div class="list-item-header"><span>Item ${i+1}</span><button class="btn-icon btn-delete" onclick="removeContactItem(${i})"><i data-lucide="trash-2"></i></button></div>
        <div class="field-row">
          ${field('Icon', `contact-icon-${i}`, item.icon)}
          ${field('Title', `contact-title-${i}`, item.title)}
        </div>
        ${textareaField('Text (HTML allowed)', `contact-text-${i}`, item.text)}
      </div>`;
  });
  itemsHtml += '<button class="btn-add" onclick="addContactItem()"><i data-lucide="plus"></i> Add Contact Item</button></div>';

  let subjectsHtml = '<div class="field-group"><h3>Form Subjects</h3>';
  c.formSubjects.forEach((s, i) => {
    subjectsHtml += `<div class="field"><input type="text" id="contact-subject-${i}" value="${escapeHtml(s)}" /></div>`;
  });
  subjectsHtml += '<button class="btn-add" onclick="addSubject()"><i data-lucide="plus"></i> Add Subject</button></div>';

  area.innerHTML = `
    <div class="field-group"><h3>Section Header</h3>
      ${field('Tag', 'contact-tag', c.tag)}
      ${field('Heading', 'contact-heading', c.heading)}
      ${textareaField('Description', 'contact-desc', c.desc)}
    </div>
    ${itemsHtml}
    <div class="field-group"><h3>Form</h3>
      ${field('Form Title', 'contact-form-title', c.formTitle)}
    </div>
    ${subjectsHtml}
    <div class="field-group"><h3>Disclaimer</h3>
      ${textareaField('Disclaimer Text', 'contact-disclaimer', c.disclaimer)}
    </div>
  `;
}
function addContactItem() { content.contact.items.push({icon:'',title:'',text:''}); renderSection('contact'); }
function removeContactItem(i) { content.contact.items.splice(i,1); renderSection('contact'); }
function addSubject() { content.contact.formSubjects.push(''); renderSection('contact'); }

// ====== FOOTER ======
function renderFooter(area) {
  const f = content.footer;
  area.innerHTML = `
    <div class="field-group"><h3>Footer Content</h3>
      ${textareaField('Description', 'footer-desc', f.desc)}
      ${field('Registration Info', 'footer-reg', f.reg)}
      ${textareaField('Address (HTML allowed)', 'footer-address', f.address)}
      <div class="field-row">
        ${field('Phone', 'footer-phone', f.phone)}
        ${field('Email', 'footer-email', f.email)}
      </div>
      ${field('Postal Address', 'footer-postal', f.postal)}
      ${textareaField('Copyright Text', 'footer-copyright', f.copyright)}
    </div>
  `;
}

// ====== TEAM ======
function renderTeam(area) {
  const team = content.team || [];
  let teamHtml = '<div class="field-group"><h3>Our Team</h3>';

  if (team.length === 0) {
    teamHtml += '<p style="color:#888;padding:20px 0;">No team members yet. Click below to add your first team member.</p>';
  } else {
    teamHtml += '<div class="team-grid">';
    team.forEach(m => {
      teamHtml += `
        <div class="team-card">
          <div class="team-photo">${m.photo ? `<img src="${m.photo}" alt="${escapeHtml(m.name)}" />` : '<span class="placeholder">No photo</span>'}</div>
          <div class="team-info">
            <h4>${escapeHtml(m.name)}</h4>
            <div class="team-role">${escapeHtml(m.role)}</div>
            <div class="team-bio">${escapeHtml(m.bio)}</div>
          </div>
          <div class="team-actions">
            <button class="btn-icon btn-edit" onclick="editTeamMember('${m.id}')"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon btn-delete" onclick="deleteTeamMember('${m.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </div>`;
    });
    teamHtml += '</div>';
  }

  teamHtml += `<button class="btn-add" onclick="showAddTeamModal()"><i data-lucide="plus"></i> Add Team Member</button></div>`;

  area.innerHTML = teamHtml;
}

function showAddTeamModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Add Team Member</h3>
      <div class="field">
        <label>Full Name</label>
        <input type="text" id="team-name" placeholder="John Doe" />
      </div>
      <div class="field">
        <label>Role / Title</label>
        <input type="text" id="team-role" placeholder="Project Director" />
      </div>
      <div class="field">
        <label>Bio</label>
        <textarea id="team-bio" rows="4" placeholder="Brief biography..."></textarea>
      </div>
      <div class="field">
        <label>Photo</label>
        <input type="file" id="team-photo" accept="image/*" />
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-confirm" onclick="saveTeamMember()">Save</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  lucide.createIcons();
}

async function saveTeamMember() {
  const name = document.getElementById('team-name').value.trim();
  const role = document.getElementById('team-role').value.trim();
  const bio = document.getElementById('team-bio').value.trim();
  const photo = document.getElementById('team-photo').files[0];

  if (!name || !role) { showToast('Name and role are required', 'error'); return; }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('role', role);
  formData.append('bio', bio);
  if (photo) formData.append('photo', photo);

  try {
    const res = await fetch('/api/admin/team', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      if (!content.team) content.team = [];
      content.team.push(data.member);
      document.querySelector('.modal-overlay').remove();
      renderSection('team');
      showToast('Team member added!');
    } else { showToast('Failed to add member', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

function editTeamMember(id) {
  const member = content.team.find(m => m.id === id);
  if (!member) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <h3>Edit Team Member</h3>
      <div class="field">
        <label>Full Name</label>
        <input type="text" id="team-name" value="${escapeHtml(member.name)}" />
      </div>
      <div class="field">
        <label>Role / Title</label>
        <input type="text" id="team-role" value="${escapeHtml(member.role)}" />
      </div>
      <div class="field">
        <label>Bio</label>
        <textarea id="team-bio" rows="4">${escapeHtml(member.bio)}</textarea>
      </div>
      <div class="field">
        <label>Photo (leave empty to keep current)</label>
        <input type="file" id="team-photo" accept="image/*" />
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-confirm" onclick="updateTeamMember('${id}')">Update</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  lucide.createIcons();
}

async function updateTeamMember(id) {
  const name = document.getElementById('team-name').value.trim();
  const role = document.getElementById('team-role').value.trim();
  const bio = document.getElementById('team-bio').value.trim();
  const photo = document.getElementById('team-photo').files[0];

  const formData = new FormData();
  formData.append('name', name);
  formData.append('role', role);
  formData.append('bio', bio);
  if (photo) formData.append('photo', photo);

  try {
    const res = await fetch(`/api/admin/team/${id}`, { method: 'PUT', body: formData });
    if (res.ok) {
      const data = await res.json();
      const idx = content.team.findIndex(m => m.id === id);
      content.team[idx] = data.member;
      document.querySelector('.modal-overlay').remove();
      renderSection('team');
      showToast('Team member updated!');
    } else { showToast('Failed to update', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

async function deleteTeamMember(id) {
  if (!confirm('Delete this team member?')) return;
  try {
    const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (res.ok) {
      content.team = content.team.filter(m => m.id !== id);
      renderSection('team');
      showToast('Team member deleted');
    } else { showToast('Failed to delete', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

// ====== GALLERY ======
let galleryItems = [];

function renderGallery(area) {
  area.innerHTML = `
    <div class="field-group">
      <h3>Gallery</h3>
      <p style="color:#666;font-size:0.9rem;margin-bottom:20px;">Upload photos of events, site visits, and activities. They appear on the public Gallery page.</p>
      <button class="btn-add" onclick="showGalleryUploadModal()"><i data-lucide="upload-cloud"></i> Upload New Image</button>
      <div id="gallery-admin-grid" class="gallery-admin-grid" style="margin-top:24px;"></div>
    </div>
  `;
  lucide.createIcons();
  loadGalleryAdmin();
}

async function loadGalleryAdmin() {
  try {
    const res = await fetch('/api/gallery');
    galleryItems = await res.json();
    renderGalleryAdminGrid();
  } catch { showToast('Failed to load gallery', 'error'); }
}

function renderGalleryAdminGrid() {
  const grid = document.getElementById('gallery-admin-grid');
  if (!grid) return;
  if (!galleryItems.length) {
    grid.innerHTML = '<p style="color:#888;padding:20px 0;">No images yet. Click "Upload New Image" to add photos.</p>';
    return;
  }
  grid.innerHTML = galleryItems.map(item => `
    <div class="gallery-admin-item" id="gadmin-${item.id}">
      <img src="${item.image}" alt="${escapeHtml(item.caption)}" loading="lazy" />
      <div class="gallery-admin-overlay">
        <button class="btn-icon btn-edit" onclick="editGalleryItem('${item.id}')" title="Edit"><i data-lucide="edit-2"></i></button>
        <button class="btn-icon btn-delete" onclick="deleteGalleryItem('${item.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="gallery-admin-caption">${escapeHtml(item.caption) || '<em style="color:#aaa;">No caption</em>'}</div>
      <div class="gallery-admin-cat">${escapeHtml(item.category)}</div>
    </div>
  `).join('');
  lucide.createIcons();
}

function showGalleryUploadModal() {
  const today = new Date().toISOString().split('T')[0];
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'galleryUploadModal';
  modal.innerHTML = `
    <div class="modal" style="width:520px;">
      <h3>Upload Gallery Image</h3>
      <div class="field">
        <label>Caption</label>
        <input type="text" id="gcaption" placeholder="Describe this photo, e.g. Site visit — Naresho, October 2026" />
      </div>
      <div class="field">
        <label>Category</label>
        <input type="text" id="gcategory" value="General" placeholder="e.g. Site Visit, Event, Team..." list="gcategory-list" />
        <datalist id="gcategory-list">
          <option value="General" />
          <option value="Site Visit" />
          <option value="Event" />
          <option value="Team" />
          <option value="Construction" />
          <option value="Community" />
        </datalist>
      </div>
      <div class="field">
        <label>Date</label>
        <input type="date" id="gdate" value="${today}" />
      </div>
      <div class="field">
        <label>Image File <span style="color:#e53e3e;">*</span></label>
        <div class="gallery-file-drop" id="galleryDropZone">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary);display:block;margin:0 auto 10px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p style="font-family:'Montserrat',sans-serif;font-weight:600;font-size:0.9rem;color:#2c2c2c;margin-bottom:4px;">Click to choose image or drag &amp; drop</p>
          <span id="galleryFileName" style="font-size:0.82rem;color:var(--primary);font-weight:600;"></span>
          <input type="file" id="galleryFileInput" accept="image/*" style="display:none;" onchange="previewGalleryFile(event)" />
        </div>
        <div id="galleryPreviewWrap" style="display:none;margin-top:12px;text-align:center;">
          <img id="galleryPreviewImg" src="" alt="Preview" style="max-height:180px;max-width:100%;border-radius:8px;object-fit:cover;box-shadow:0 2px 12px rgba(0,0,0,0.1);" />
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-confirm" id="galleryUploadSaveBtn" onclick="saveGalleryUpload()">Save &amp; Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('galleryDropZone').addEventListener('click', () => {
    document.getElementById('galleryFileInput').click();
  });

  const zone = document.getElementById('galleryDropZone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--primary)'; zone.style.background = 'rgba(123,28,46,0.04)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; zone.style.background = ''; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    zone.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('galleryFileInput').files = dt.files;
      previewGalleryFile({ target: { files: dt.files } });
    }
  });
}

function previewGalleryFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('galleryFileName').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('galleryPreviewImg').src = e.target.result;
    document.getElementById('galleryPreviewWrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function saveGalleryUpload() {
  const fileInput = document.getElementById('galleryFileInput');
  const caption = document.getElementById('gcaption').value.trim();
  const category = document.getElementById('gcategory').value.trim() || 'General';
  const date = document.getElementById('gdate').value;

  if (!fileInput.files[0]) {
    showToast('Please choose an image file first', 'error');
    return;
  }

  const btn = document.getElementById('galleryUploadSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);
  formData.append('caption', caption);
  formData.append('category', category);
  formData.append('date', date);

  try {
    const res = await fetch('/api/admin/gallery', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      galleryItems.unshift(data.item);
      document.getElementById('galleryUploadModal').remove();
      renderGalleryAdminGrid();
      showToast('Image uploaded successfully!');
    } else {
      showToast('Upload failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Save & Upload';
    }
  } catch {
    showToast('Connection error', 'error');
    btn.disabled = false;
    btn.textContent = 'Save & Upload';
  }
}

function editGalleryItem(id) {
  const item = galleryItems.find(g => g.id === id);
  if (!item) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="width:520px;">
      <h3>Edit Gallery Image</h3>
      <div style="text-align:center;margin-bottom:20px;">
        <img src="${item.image}" style="max-width:100%;max-height:200px;border-radius:8px;object-fit:cover;box-shadow:0 2px 12px rgba(0,0,0,0.1);" />
      </div>
      <div class="field">
        <label>Caption</label>
        <input type="text" id="gcaption" value="${escapeHtml(item.caption)}" placeholder="Describe this photo..." />
      </div>
      <div class="field">
        <label>Category</label>
        <input type="text" id="gcategory" value="${escapeHtml(item.category)}" placeholder="e.g. Site Visit, Event, Team..." list="gcategory-edit-list" />
        <datalist id="gcategory-edit-list">
          <option value="General" />
          <option value="Site Visit" />
          <option value="Event" />
          <option value="Team" />
          <option value="Construction" />
          <option value="Community" />
        </datalist>
      </div>
      <div class="field">
        <label>Date</label>
        <input type="date" id="gdate" value="${item.date}" />
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-confirm" onclick="saveGalleryEdit('${id}')">Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveGalleryEdit(id) {
  const caption = document.getElementById('gcaption').value;
  const category = document.getElementById('gcategory').value || 'General';
  const date = document.getElementById('gdate').value;
  try {
    const res = await fetch('/api/admin/gallery/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, category, date })
    });
    if (res.ok) {
      const data = await res.json();
      const idx = galleryItems.findIndex(g => g.id === id);
      galleryItems[idx] = data.item;
      document.querySelector('.modal-overlay').remove();
      renderGalleryAdminGrid();
      showToast('Image updated!');
    } else { showToast('Failed to update', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

async function deleteGalleryItem(id) {
  if (!confirm('Delete this image from the gallery?')) return;
  try {
    const res = await fetch('/api/admin/gallery/' + id, { method: 'DELETE' });
    if (res.ok) {
      galleryItems = galleryItems.filter(g => g.id !== id);
      renderGalleryAdminGrid();
      showToast('Image deleted');
    } else { showToast('Failed to delete', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}


// ====== BLOG/NEWS ======
let blogPosts = [];

function renderBlog(area) {
  area.innerHTML = `
    <div class="field-group">
      <h3>Blog / News Articles</h3>
      <button class="btn-add" onclick="showBlogEditor()"><i data-lucide="plus"></i> Write New Article</button>
      <div id="blog-list"></div>
    </div>
  `;
  loadBlogPosts();
}

async function loadBlogPosts() {
  try {
    const res = await fetch('/api/blog');
    blogPosts = await res.json();
    renderBlogList();
  } catch {
    showToast('Failed to load blog posts', 'error');
  }
}

function renderBlogList() {
  const listEl = document.getElementById('blog-list');
  if (!blogPosts || blogPosts.length === 0) {
    listEl.innerHTML = '<p style="color:#888;padding:20px 0;">No articles yet. Click "Write New Article" to create your first post.</p>';
    return;
  }
  listEl.innerHTML = blogPosts.map(p => `
    <div class="list-item" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <div style="width:80px;height:60px;border-radius:6px;overflow:hidden;background:#f0f0f0;flex-shrink:0;">
        ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ccc;font-size:1.5rem;"><i data-lucide="image"></i></div>'}
      </div>
      <div style="flex:1;min-width:200px;">
        <div style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:0.95rem;color:#0d1117;">${escapeHtml(p.title)}</div>
        <div style="font-size:0.78rem;color:#888;margin-top:4px;">${p.date} ${p.published ? '• <span style="color:#22a06b;font-weight:600;">Published</span>' : '• <span style="color:#e53e3e;font-weight:600;">Draft</span>'}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-icon btn-edit" onclick="editBlogPost('${p.id}')"><i data-lucide="edit-2"></i></button>
        <button class="btn-icon btn-delete" onclick="deleteBlogPost('${p.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function showBlogEditor(post) {
  const isEdit = !!post;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="width:700px;">
      <h3>${isEdit ? 'Edit Article' : 'Write New Article'}</h3>
      <div class="field">
        <label>Title</label>
        <input type="text" id="blog-title" value="${post ? escapeHtml(post.title) : ''}" placeholder="Article title" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Author</label>
          <input type="text" id="blog-author" value="${post ? escapeHtml(post.author) : 'Admin'}" placeholder="Author name" />
        </div>
        <div class="field">
          <label>Date</label>
          <input type="date" id="blog-date" value="${post ? post.date : new Date().toISOString().split('T')[0]}" />
        </div>
      </div>
      <div class="field">
        <label>Featured Image</label>
        <input type="file" id="blog-image" accept="image/*" />
        ${post && post.image ? `<div style="margin-top:8px;"><img src="${post.image}" style="width:120px;height:80px;object-fit:cover;border-radius:6px;" /></div>` : ''}
      </div>
      <div class="field">
        <label>Excerpt (short summary shown on the blog listing)</label>
        <textarea id="blog-excerpt" rows="2" placeholder="A brief summary of this article...">${post ? escapeHtml(post.excerpt) : ''}</textarea>
      </div>
      <div class="field">
        <label>Full Article Content (HTML allowed)</label>
        <textarea id="blog-content" rows="12" placeholder="Write your full article here. You can use HTML tags like <p>, <h3>, <strong>, <ul>, <li>, etc.">${post ? escapeHtml(post.content) : ''}</textarea>
      </div>
      <div class="field">
        <label><input type="checkbox" id="blog-published" ${post && post.published ? 'checked' : ''} /> &nbsp;Publish this article (uncheck to save as draft)</label>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-confirm" onclick="saveBlogPost(${post ? `'${post.id}'` : 'null'})">${isEdit ? 'Update' : 'Publish'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  lucide.createIcons();
}

async function saveBlogPost(id) {
  const title = document.getElementById('blog-title').value.trim();
  const author = document.getElementById('blog-author').value.trim();
  const date = document.getElementById('blog-date').value;
  const excerpt = document.getElementById('blog-excerpt').value.trim();
  const content = document.getElementById('blog-content').value.trim();
  const published = document.getElementById('blog-published').checked;
  const image = document.getElementById('blog-image').files[0];

  if (!title) { showToast('Title is required', 'error'); return; }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('author', author);
  formData.append('date', date);
  formData.append('excerpt', excerpt);
  formData.append('content', content);
  formData.append('published', published);
  if (image) formData.append('image', image);

  try {
    const url = id ? `/api/admin/blog/${id}` : '/api/admin/blog';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: formData });
    if (res.ok) {
      document.querySelector('.modal-overlay').remove();
      await loadBlogPosts();
      showToast(id ? 'Article updated!' : 'Article created!');
    } else { showToast('Failed to save article', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

function editBlogPost(id) {
  const post = blogPosts.find(p => p.id === id);
  if (post) showBlogEditor(post);
}

async function deleteBlogPost(id) {
  if (!confirm('Delete this article? This cannot be undone.')) return;
  try {
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadBlogPosts();
      showToast('Article deleted');
    } else { showToast('Failed to delete', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

// ====== SETTINGS ======

function renderSettings(area) {
  const s = content.site;
  area.innerHTML = `
    <div class="settings-grid">

      <!-- Site Identity Card -->
      <div class="settings-section-card">
        <div class="settings-section-icon" style="background:rgba(123,28,46,0.1);color:var(--primary);">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </div>
        <div class="settings-section-title">Site Identity</div>
        <div class="settings-section-desc">Your site name and branding logo</div>
        <div class="field" style="margin-top:20px;">
          <label>Site Title</label>
          <input type="text" id="site-title" value="${escapeHtml(s.title)}" placeholder="Your website title..." />
          <div class="hint">Appears in the browser tab and search results</div>
        </div>
        <div class="field" style="margin-top:4px;">
          <label>Logo</label>
          <div class="logo-upload-area">
            <div class="logo-current">
              <img src="/${s.logo}" alt="Current Logo" id="logoPreview" />
            </div>
            <div class="logo-upload-right">
              <div class="logo-upload-info">
                <strong>Current logo</strong>
                <span>${s.logo}</span>
              </div>
              <label class="logo-upload-btn" for="logo-upload">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload New Logo
              </label>
              <input type="file" id="logo-upload" accept="image/*" style="display:none;" onchange="uploadLogo(event)" />
              <p class="hint" style="margin-top:6px;">JPG, PNG or SVG, max 5MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Password Card -->
      <div class="settings-section-card">
        <div class="settings-section-icon" style="background:rgba(201,168,76,0.12);color:#c9a84c;">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div class="settings-section-title">Change Password</div>
        <div class="settings-section-desc">Update your admin login password</div>
        <div class="field" style="margin-top:20px;">
          <label>Current Password</label>
          <div class="password-input-wrap">
            <input type="password" id="current-pass" placeholder="Enter your current password" />
          </div>
        </div>
        <div class="field">
          <label>New Password</label>
          <input type="password" id="new-pass" placeholder="Minimum 6 characters" />
        </div>
        <div class="field">
          <label>Confirm New Password</label>
          <input type="password" id="confirm-pass" placeholder="Re-enter new password" />
        </div>
        <button class="settings-action-btn" onclick="changePassword()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Update Password
        </button>
      </div>

    </div>
  `;
}

async function uploadLogo(event) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('logo', file);
  try {
    const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      content.site.logo = data.logo;
      renderSection('settings');
      showToast('Logo updated!');
    } else { showToast('Failed to upload logo', 'error'); }
  } catch { showToast('Connection error', 'error'); }
}

async function changePassword() {
  const current = document.getElementById('current-pass').value;
  const newPass = document.getElementById('new-pass').value;
  const confirmPass = document.getElementById('confirm-pass').value;

  if (newPass !== confirmPass) { showToast('Passwords do not match', 'error'); return; }
  if (newPass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass })
    });
    if (res.ok) {
      showToast('Password changed successfully!');
      document.getElementById('current-pass').value = '';
      document.getElementById('new-pass').value = '';
      document.getElementById('confirm-pass').value = '';
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to change password', 'error');
    }
  } catch { showToast('Connection error', 'error'); }
}

// ====== COLLECT FORM DATA ======
function collectFormData() {
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  const isChecked = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

  switch(currentSection) {
    case 'hero': {
      const stats = content.hero.stats.map((s, i) => ({
        num: get(`hero-stat-num-${i}`),
        unit: get(`hero-stat-unit-${i}`),
        label: get(`hero-stat-label-${i}`)
      }));
      return {
        badge: get('hero-badge'),
        heading: get('hero-heading'),
        headingHighlight: get('hero-highlight'),
        subheading: get('hero-subheading'),
        btnPrimary: get('hero-btn1'),
        btnPrimaryLink: get('hero-btn1-link'),
        btnSecondary: get('hero-btn2'),
        btnSecondaryLink: get('hero-btn2-link'),
        stats
      };
    }
    case 'about': {
      return {
        tag: get('about-tag'),
        heading: get('about-heading'),
        paragraphs: content.about.paragraphs.map((_, i) => get(`about-para-${i}`)),
        certs: content.about.certs.map((_, i) => get(`about-cert-${i}`)),
        cards: content.about.cards.map((_, i) => ({
          icon: get(`about-card-icon-${i}`),
          title: get(`about-card-title-${i}`),
          text: get(`about-card-text-${i}`)
        }))
      };
    }
    case 'project': {
      return {
        tag: get('proj-tag'),
        heading: get('proj-heading'),
        desc: get('proj-desc'),
        subHeading: get('proj-subheading'),
        facts: content.project.facts.map((_, i) => ({
          icon: get(`proj-fact-icon-${i}`),
          label: get(`proj-fact-label-${i}`),
          value: get(`proj-fact-value-${i}`)
        })),
        details: content.project.details.map((_, i) => ({
          icon: get(`proj-detail-icon-${i}`),
          title: get(`proj-detail-title-${i}`),
          text: get(`proj-detail-text-${i}`)
        })),
        sponsor: {
          badge: get('proj-sponsor-badge'),
          name: get('proj-sponsor-name'),
          detail: get('proj-sponsor-detail')
        },
        opportunity: {
          title: get('proj-opp-title'),
          text: get('proj-opp-text')
        },
        advisors: {
          title: content.project.advisors.title,
          intro: content.project.advisors.intro,
          list: content.project.advisors.list.map((_, i) => ({
            role: get(`proj-adv-role-${i}`),
            name: get(`proj-adv-name-${i}`)
          }))
        },
        kenyaContext: {
          title: get('proj-kenya-title'),
          text: get('proj-kenya-text')
        }
      };
    }
    case 'structure': {
      const levels = content.structure.levels.map((lv, i) => {
        if (lv.box) {
          return {
            box: {
              icon: get(`struct-icon-${i}`),
              title: get(`struct-title-${i}`),
              badge: lv.box.badge !== undefined ? get(`struct-badge-${i}`) : undefined,
              desc: get(`struct-desc-${i}`),
              type: lv.box.type
            }
          };
        } else if (lv.split) {
          return {
            split: true,
            boxes: lv.boxes.map((b, j) => ({
              icon: get(`struct-split-icon-${i}-${j}`),
              title: get(`struct-split-title-${i}-${j}`),
              desc: get(`struct-split-desc-${i}-${j}`),
              type: b.type
            }))
          };
        }
        return lv;
      });
      return {
        tag: get('struct-tag'),
        heading: get('struct-heading'),
        desc: get('struct-desc'),
        levels
      };
    }
    case 'timeline': {
      return {
        tag: get('tl-tag'),
        heading: get('tl-heading'),
        desc: get('tl-desc'),
        items: content.timeline.items.map((item, i) => ({
          phase: get(`tl-phase-${i}`),
          title: get(`tl-title-${i}`),
          active: isChecked(`tl-active-${i}`),
          items: item.items.map((_, j) => get(`tl-item-${i}-sub-${j}`))
        }))
      };
    }
    case 'why': {
      return {
        tag: get('why-tag'),
        heading: get('why-heading'),
        desc: get('why-desc'),
        cards: content.why.cards.map((_, i) => ({
          num: get(`why-num-${i}`),
          icon: get(`why-icon-${i}`),
          title: get(`why-title-${i}`),
          text: get(`why-text-${i}`)
        })),
        cta: {
          heading: get('why-cta-heading'),
          text: get('why-cta-text'),
          btnText: get('why-cta-btn'),
          btnLink: get('why-cta-link')
        }
      };
    }
    case 'contact': {
      return {
        tag: get('contact-tag'),
        heading: get('contact-heading'),
        desc: get('contact-desc'),
        items: content.contact.items.map((_, i) => ({
          icon: get(`contact-icon-${i}`),
          title: get(`contact-title-${i}`),
          text: get(`contact-text-${i}`)
        })),
        disclaimer: get('contact-disclaimer'),
        formTitle: get('contact-form-title'),
        formSubjects: content.contact.formSubjects.map((_, i) => get(`contact-subject-${i}`))
      };
    }
    case 'footer': {
      return {
        desc: get('footer-desc'),
        reg: get('footer-reg'),
        address: get('footer-address'),
        phone: get('footer-phone'),
        email: get('footer-email'),
        postal: get('footer-postal'),
        copyright: get('footer-copyright')
      };
    }
    case 'settings': {
      content.site.title = get('site-title');
      return content.site;
    }
    default: return null;
  }
}
