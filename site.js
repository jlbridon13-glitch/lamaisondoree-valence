// Une requête photo momentanément interrompue est retentée une seule fois.
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{
  const retry=()=>{
    if(img.dataset.retried)return;
    img.dataset.retried='true';
    img.src+=img.src.includes('?')?'&retry=1':'?retry=1';
  };
  img.addEventListener('error',retry,{once:true});
  if(img.complete && img.naturalWidth===0)retry();
});
const dialog=document.querySelector('.gallery-dialog');
if(dialog){
  dialog.querySelector('img').addEventListener('error',()=>{
    const photo=dialog.querySelector('img');
    if(photo.dataset.retriedFor===photo.src)return;
    photo.dataset.retriedFor=photo.src+'&retry=1';
    photo.src=photo.dataset.retriedFor;
  });
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  document.querySelectorAll('[data-full]').forEach(button=>button.addEventListener('click',()=>{
    dialog.querySelector('img').src=button.dataset.full;
    dialog.querySelector('img').alt=button.dataset.caption;
    dialog.querySelector('p').textContent=button.dataset.caption;
    dialog.showModal();
  }));
}
const filters=document.querySelectorAll('[data-filter]');
if(filters.length){
  filters.forEach(button=>button.addEventListener('click',()=>{
    filters.forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button))});
    document.querySelectorAll('.pizza-list [data-base]').forEach(pizza=>{pizza.hidden=button.dataset.filter!=='all'&&pizza.dataset.base!==button.dataset.filter});
  }));
}

const galleryRail=document.querySelector('.gallery-grid');
if(galleryRail){
  const move=direction=>galleryRail.scrollBy({left:direction*Math.max(300,galleryRail.clientWidth*.8),behavior:'smooth'});
  document.querySelector('.gallery-prev').addEventListener('click',()=>move(-1));
  document.querySelector('.gallery-next').addEventListener('click',()=>move(1));
}

if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver((entries)=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
  }),{threshold:.08});
  document.querySelectorAll('.menu-card,.pizza-spotlight,.split,.play-copy,.gallery-section h2,.pizza-list li,.event-card,.private-content').forEach(item=>observer.observe(item));
}

// Dates récurrentes calculées selon le calendrier de Valence (Europe/Paris).
const eventWeekdays={mercredi:3,jeudi:4};
function parisToday(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const values=Object.fromEntries(parts.map(part=>[part.type,Number(part.value)]));
  return {year:values.year,month:values.month-1,day:values.day};
}
function nthWeekday(year,month,weekday,ordinal){
  const firstDay=new Date(Date.UTC(year,month,1)).getUTCDay();
  const day=1+(weekday-firstDay+7)%7+(ordinal-1)*7;
  return new Date(Date.UTC(year,month,day,12));
}
// Règles des rendez-vous : « jeudi-3 » = 3e jeudi du mois ;
// « jeudi-apres-mercredi-2 » = le jeudi de la semaine qui suit le 2e mercredi (2e mercredi + 8 jours).
function eventDateFor(rule,year,month){
  const after=rule.match(/^(\w+)-apres-(\w+)-(\d)$/);
  if(after){
    const base=nthWeekday(year,month,eventWeekdays[after[2]],Number(after[3]));
    const offset=(eventWeekdays[after[1]]-eventWeekdays[after[2]]+7)%7+7;
    return new Date(base.getTime()+offset*86400000);
  }
  const [weekday,ordinalText]=rule.split('-');
  return nthWeekday(year,month,eventWeekdays[weekday],Number(ordinalText));
}
function nextMonthly(rule){
  const today=parisToday();
  let year=today.year,month=today.month;
  let date=eventDateFor(rule,year,month);
  const todayUTC=Date.UTC(today.year,today.month,today.day,12);
  if(date.getTime()<todayUTC){
    month++;
    if(month>11){month=0;year++}
    date=eventDateFor(rule,year,month);
  }
  return date;
}
function updateEventDates(){
  document.querySelectorAll('[data-event-date]').forEach(node=>{
    const date=nextMonthly(node.dataset.eventDate);
    node.textContent=new Intl.DateTimeFormat('fr-FR',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
    node.dateTime=date.toISOString().slice(0,10);
  });
}
updateEventDates();
if(document.querySelector('[data-event-date]'))setInterval(updateEventDates,15*60*1000);

const petanqueRange=document.querySelector('#petanque-range');
if(petanqueRange){
  const compare=petanqueRange.closest('.petanque-compare');
  let frame=0;
  petanqueRange.addEventListener('input',()=>{
    if(!frame)frame=requestAnimationFrame(()=>{
      compare.style.setProperty('--split',petanqueRange.value+'%');
      frame=0;
    });
    petanqueRange.setAttribute('aria-valuetext',`${petanqueRange.value} % de la vue pétanque visible`);
  });
}

// Instagram ne charge son lecteur qu'au moment où le visiteur demande la vidéo.
const reelButton=document.querySelector('.reel-play');
if(reelButton){
  reelButton.addEventListener('click',()=>{
    const frame=document.createElement('iframe');
    frame.src='https://www.instagram.com/reel/DF7nYq7MLCT/embed/';
    frame.title='Vidéo des pizzas de La Maison Dorée sur Instagram';
    frame.allow='autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen=true;
    frame.referrerPolicy='strict-origin-when-cross-origin';
    reelButton.replaceWith(frame);
  },{once:true});
}

const menuToggle=document.querySelector('.menu-toggle');
if(menuToggle){
  const nav=document.querySelector('#main-nav');
  menuToggle.addEventListener('click',()=>{
    const open=menuToggle.getAttribute('aria-expanded')!=='true';
    menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');
    nav.classList.toggle('is-open',open);
  });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    menuToggle.setAttribute('aria-expanded','false');
    menuToggle.setAttribute('aria-label','Ouvrir le menu');
    nav.classList.remove('is-open');
  }));
}

const contactDialog=document.querySelector('#contact-dialog');
if(contactDialog){
  document.querySelectorAll('a[href^="tel:"]:not([data-direct-call])').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();
    contactDialog.showModal();
  }));
  contactDialog.querySelector('.contact-close').addEventListener('click',()=>contactDialog.close());
  contactDialog.addEventListener('click',event=>{if(event.target===contactDialog)contactDialog.close()});
  contactDialog.querySelector('.contact-copy').addEventListener('click',async()=>{
    const input=contactDialog.querySelector('#contact-number');
    let copied=false;
    try{await navigator.clipboard.writeText(input.value);copied=true}catch(_){input.select();copied=document.execCommand('copy')}
    contactDialog.querySelector('.contact-feedback').textContent=copied?'Numéro copié. Vous pouvez le coller dans votre téléphone.':'Sélectionnez le numéro affiché pour le copier.';
  });
}

// Saison 2026–2027 recopiée du calendrier officiel du VRDR.
// Les dates sont filtrées côté visiteur ; toute modification officielle se consulte via le lien du club.
const vrdrFixtures=[
  ['2026-09-25','FC Grenoble','VRDR','21h00'],
  ['2026-10-09','VRDR','Béziers','19h30'],
  ['2026-10-16','Oyonnax','VRDR','19h00'],
  ['2026-10-23','VRDR','Colomiers','19h30'],
  ['2026-10-30','Biarritz','VRDR','19h30'],
  ['2026-11-06','VRDR','Nevers','19h30'],
  ['2026-11-20','Nissa Rugby','VRDR','19h30'],
  ['2026-11-27','VRDR','Aurillac','19h30'],
  ['2026-12-04','Montauban','VRDR','19h30'],
  ['2026-12-11','VRDR','Narbonne','19h30'],
  ['2026-12-18','VRDR','Agen','19h30'],
  ['2027-01-08','Provence Rugby','VRDR','19h30'],
  ['2027-01-15','VRDR','FC Grenoble','19h30'],
  ['2027-01-22','Soyaux-Angoulême','VRDR','19h30'],
  ['2027-01-29','VRDR','Biarritz','19h30'],
  ['2027-02-12','Colomiers','VRDR','19h30'],
  ['2027-02-19','VRDR','Nissa Rugby','19h30'],
  ['2027-02-26','Narbonne','VRDR','19h30'],
  ['2027-03-05','VRDR','Brive','19h30'],
  ['2027-03-26','Aurillac','VRDR','19h30'],
  ['2027-04-02','VRDR','Dax','19h30'],
  ['2027-04-09','Agen','VRDR','19h30'],
  ['2027-04-16','VRDR','Montauban','19h30'],
  ['2027-04-23','Nevers','VRDR','19h30'],
  ['2027-05-07','Béziers','VRDR','19h30'],
  ['2027-05-14','VRDR','Oyonnax','19h30']
];
const fixtureList=document.querySelector('.vrdr-list');
if(fixtureList){
  const today=new Date();today.setHours(0,0,0,0);
  const upcoming=vrdrFixtures.filter(([date])=>new Date(date+'T23:59:59')>=today).slice(0,3);
  fixtureList.replaceChildren();
  if(!upcoming.length){fixtureList.textContent='Le prochain calendrier sera publié par le VRDR.'}
  else upcoming.forEach(([date,home,away,time])=>{
    const card=document.createElement('article');card.className='fixture';
    const day=document.createElement('time');day.dateTime=date;
    day.textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00'));
    const teams=document.createElement('strong');teams.textContent=home+' · '+away;
    const hour=document.createElement('span');hour.textContent=time;
    card.append(day,teams,hour);fixtureList.append(card);
  });
}
