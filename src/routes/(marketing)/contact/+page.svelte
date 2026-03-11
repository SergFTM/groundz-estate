<script lang="ts">
  import { enhance } from '$app/forms';

  let { form } = $props();
  let formErrors = $derived((form as { errors?: Record<string, string>; success?: boolean } | null)?.errors ?? {});
</script>

<svelte:head>
  <title>Contact — Develta</title>
  <meta name="description" content="Get in touch with the Develta team. We're based in Limassol, Cyprus." />
</svelte:head>

<section class="contact-section">
  <div class="container">
    <div class="section-header">
      <span class="section-label">CONTACT</span>
      <h2 class="section-title">Get In Touch</h2>
    </div>

    <div class="contact-grid">
      <!-- Form -->
      <div class="contact-form-wrap">
        {#if form?.success}
          <div class="success-banner">
            Message sent! Our team will reply within 24 hours.
          </div>
        {:else}
          <form method="POST" action="?/sendMessage" use:enhance class="contact-form">
            {#if formErrors.general}
              <p class="form-error">{formErrors.general}</p>
            {/if}

            <div class="form-field">
              <label for="name">Full Name *</label>
              <input id="name" name="name" type="text" placeholder="Your name" required />
              {#if formErrors.name}<span class="field-error">{formErrors.name}</span>{/if}
            </div>

            <div class="form-field">
              <label for="email">Email Address *</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required />
              {#if formErrors.email}<span class="field-error">{formErrors.email}</span>{/if}
            </div>

            <div class="form-field">
              <label for="phone">Phone Number (optional)</label>
              <input id="phone" name="phone" type="tel" placeholder="+357 99 000000" />
              {#if formErrors.phone}<span class="field-error">{formErrors.phone}</span>{/if}
            </div>

            <div class="form-field">
              <label for="message">Message *</label>
              <textarea id="message" name="message" rows="5" placeholder="How can we help you?" required></textarea>
              {#if formErrors.message}<span class="field-error">{formErrors.message}</span>{/if}
            </div>

            <button type="submit" class="btn-primary">Send Message →</button>
          </form>
        {/if}
      </div>

      <!-- Office info + map -->
      <div class="contact-info">
        <div class="office-card">
          <h3 class="office-title">Our Office</h3>
          <div class="office-details">
            <div class="office-item">
              <span class="office-label">Address</span>
              <span>28 Octovriou Avenue, Limassol 3035, Cyprus</span>
            </div>
            <div class="office-item">
              <span class="office-label">Phone</span>
              <a href="tel:+35725000000">+357 25 000 000</a>
            </div>
            <div class="office-item">
              <span class="office-label">Email</span>
              <a href="mailto:info@develta.cy">info@develta.cy</a>
            </div>
            <div class="office-item">
              <span class="office-label">Hours</span>
              <span>Mon–Fri 9:00–18:00</span>
            </div>
          </div>
        </div>

        <div class="map-wrap">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26268.774985040965!2d33.01!3d34.685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14e733905cc8519d%3A0x1f7af8765ce62b45!2sLimassol!5e0!3m2!1sen!2scy!4v1709000000000"
            width="100%"
            height="280"
            style="border:0; border-radius: var(--radius-lg);"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Develta office location — Limassol, Cyprus"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .contact-section {
    padding: var(--space-20) 0;
    min-height: 60vh;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }

  .section-header {
    margin-bottom: var(--space-12);
  }

  .section-label {
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-accent);
    display: block;
    margin-bottom: var(--space-2);
  }

  .section-title {
    font-size: var(--text-4xl);
    font-weight: 300;
    font-style: italic;
    font-family: 'IvyoraDisplay', serif;
    color: var(--color-text);
    margin: 0;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-12);
    align-items: start;
  }

  @media (max-width: 800px) {
    .contact-grid { grid-template-columns: 1fr; }
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .form-field label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .form-field input,
  .form-field textarea {
    padding: var(--space-3) var(--space-4);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.7);
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: inherit;
    resize: vertical;
  }

  .btn-primary {
    align-self: flex-start;
    padding: var(--space-4) var(--space-8);
    background: var(--color-accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    transition: opacity var(--transition-base);
  }

  .btn-primary:hover { opacity: 0.88; }

  .field-error {
    font-size: var(--text-xs);
    color: #ef4444;
  }

  .form-error {
    color: #ef4444;
    font-size: var(--text-sm);
    padding: var(--space-3);
    background: rgba(239, 68, 68, 0.05);
    border-radius: var(--radius-md);
    margin: 0;
  }

  .success-banner {
    padding: var(--space-10);
    text-align: center;
    background: rgba(122, 140, 110, 0.08);
    border-radius: var(--radius-lg);
    color: var(--color-accent);
    font-weight: 600;
    font-size: var(--text-base);
  }

  .office-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-5);
  }

  .office-title {
    font-size: var(--text-base);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text);
    margin: 0 0 var(--space-5);
  }

  .office-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .office-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .office-label {
    font-size: var(--text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
  }

  .office-item a {
    color: var(--color-accent);
    text-decoration: none;
  }

  .office-item a:hover {
    text-decoration: underline;
  }

  .map-wrap {
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
</style>
