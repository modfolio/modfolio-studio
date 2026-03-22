/// <reference types="astro/client" />

interface SessionUser {
	id: string;
	email: string;
	name: string;
	roles: string[];
	avatar?: string;
	orgs?: Array<{ id: string; slug: string; role: string }>;
	permissions?: string[];
	amr?: string[];
	tenantId?: string;
	tenantDomain?: string;
}

declare namespace App {
	interface Locals {
		user: SessionUser | null;
	}
}
