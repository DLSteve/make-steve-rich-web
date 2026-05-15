import './style.css';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRandomIncrement(): number {
  return Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
}

function getRandomInterval(): number {
  return Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
}

function initDonationTicker(): void {
  const tickerEl = document.getElementById('donation-ticker');
  if (!tickerEl) return;

  let currentAmount = 4_782_341;
  tickerEl.textContent = formatCurrency(currentAmount);

  function tick(): void {
    currentAmount += getRandomIncrement();
    tickerEl!.classList.add('scale-110', 'text-[#2E9E6B]');

    requestAnimationFrame(() => {
      tickerEl!.textContent = formatCurrency(currentAmount);

      setTimeout(() => {
        tickerEl!.classList.remove('scale-110', 'text-[#2E9E6B]');
      }, 600);
    });

    setTimeout(tick, getRandomInterval());
  }

  setTimeout(tick, getRandomInterval());
}

function initSmoothScroll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const href = anchor.getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDonationTicker();
  initSmoothScroll();
});
