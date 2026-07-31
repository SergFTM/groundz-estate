<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { locale } from '$lib/stores/locale';
	import { t } from '$lib/i18n';

	let { form }: { form: ActionData } = $props();

	let formErrors = $derived(
		(form as { errors?: Record<string, string> } | null)?.errors ?? {}
	);
	let formValues = $derived(
		(form as { values?: Record<string, string> } | null)?.values ?? {}
	);

	let activeTab = $state<'login' | 'register'>('login');
</script>

<svelte:head>
	<title>{t($locale, 'auth.tabLogin')} — Groundz</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-header">
			<h1 class="auth-title">{t($locale, 'auth.welcome')}</h1>
			<p class="auth-subtitle">{t($locale, 'auth.subtitle')}</p>
		</div>

		<div class="auth-tabs">
			<button
				class="auth-tab"
				class:auth-tab--active={activeTab === 'login'}
				onclick={() => (activeTab = 'login')}
				type="button"
			>
				{t($locale, 'auth.tabLogin')}
			</button>
			<button
				class="auth-tab"
				class:auth-tab--active={activeTab === 'register'}
				onclick={() => (activeTab = 'register')}
				type="button"
			>
				{t($locale, 'auth.tabRegister')}
			</button>
		</div>

		{#if form?.error}
			<div class="auth-alert">{form.error}</div>
		{/if}

		{#if activeTab === 'login'}
			<form method="POST" action="?/login" use:enhance>
				<div class="form-group">
					<label class="form-label" for="login-email">{t($locale, 'auth.email')}</label>
					<input
						class="form-input"
						type="email"
						id="login-email"
						name="email"
						placeholder="you@example.com"
						value={formValues.email ?? ''}
						required
					/>
					{#if formErrors.email}
						<p class="form-error">{formErrors.email}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="login-password">{t($locale, 'auth.password')}</label>
					<input
						class="form-input"
						type="password"
						id="login-password"
						name="password"
						placeholder={t($locale, 'auth.yourPassword')}
						required
					/>
					{#if formErrors.password}
						<p class="form-error">{formErrors.password}</p>
					{/if}
				</div>

				<div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-4);">
					<a href="/auth/forgot-password" style="font-size:var(--text-xs);color:var(--color-primary);text-decoration:none;">{t($locale, 'auth.forgot')}</a>
				</div>

				<button class="btn btn--primary btn--full" type="submit">{t($locale, 'auth.signIn')}</button>
			</form>
		{:else}
			<form method="POST" action="?/register" use:enhance>
				<div class="form-group">
					<label class="form-label" for="reg-name">{t($locale, 'auth.fullName')}</label>
					<input
						class="form-input"
						type="text"
						id="reg-name"
						name="name"
						placeholder="John Doe"
						value={formValues.name ?? ''}
						required
					/>
					{#if formErrors.name}
						<p class="form-error">{formErrors.name}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-email">{t($locale, 'auth.email')}</label>
					<input
						class="form-input"
						type="email"
						id="reg-email"
						name="email"
						placeholder="you@example.com"
						value={formValues.email ?? ''}
						required
					/>
					{#if formErrors.email}
						<p class="form-error">{formErrors.email}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-password">{t($locale, 'auth.password')}</label>
					<input
						class="form-input"
						type="password"
						id="reg-password"
						name="password"
						placeholder={t($locale, 'auth.minChars')}
						required
					/>
					{#if formErrors.password}
						<p class="form-error">{formErrors.password}</p>
					{/if}
				</div>

				<div class="form-group">
					<label class="form-label" for="reg-role">{t($locale, 'auth.iAmA')}</label>
					<select class="form-input form-select" id="reg-role" name="role" required>
						<option value="buyer" selected={formValues.role === 'buyer'}>{t($locale, 'auth.roleBuyer')}</option>
						<option value="investor" selected={formValues.role === 'investor'}>{t($locale, 'auth.roleInvestor')}</option>
						<option value="agent" selected={formValues.role === 'agent'}>{t($locale, 'auth.roleAgent')}</option>
					</select>
					{#if formErrors.role}
						<p class="form-error">{formErrors.role}</p>
					{/if}
				</div>

				<button class="btn btn--primary btn--full" type="submit">{t($locale, 'auth.createAccount')}</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - var(--header-height, 80px));
		padding: var(--space-8) var(--space-4);
		background: var(--color-bg-alt);
	}

	.auth-card {
		width: 100%;
		max-width: 480px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		padding: var(--space-12) var(--space-10);
	}

	.auth-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.auth-title {
		font-family: var(--font-display);
		font-size: var(--text-4xl);
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.auth-subtitle {
		color: var(--color-text-muted);
		font-size: var(--text-base);
		margin-bottom: 0;
	}

	.auth-tabs {
		display: flex;
		border-bottom: 1px solid var(--color-border);
		margin-bottom: var(--space-8);
	}

	.auth-tab {
		flex: 1;
		padding: var(--space-3) var(--space-4);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-family: var(--font-body);
		font-size: var(--text-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.auth-tab:hover {
		color: var(--color-text);
	}

	.auth-tab--active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
	}

	.auth-alert {
		background: rgba(239, 68, 68, 0.08);
		color: var(--color-error);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		margin-bottom: var(--space-6);
		border-left: 3px solid var(--color-error);
	}

	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
	}

	@media (max-width: 540px) {
		.auth-card {
			padding: var(--space-8) var(--space-6);
		}

		.auth-title {
			font-size: var(--text-3xl);
		}
	}
</style>
