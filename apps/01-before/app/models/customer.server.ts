import type { Customer } from '@prisma/client'
import { prisma } from '~/db.server'
import { getInvoiceDerivedData } from './invoice.server'

export async function searchCustomers(query: string) {
	const customers = await prisma.customer.findMany({
		select: {
			id: true,
			name: true,
			email: true,
		},
		where: {
			OR: [{ name: { contains: query } }, { email: { contains: query } }],
		},
		take: 8,
	})
	return customers
}

export async function getFirstCustomer() {
	return prisma.customer.findFirst()
}

export async function getCustomerListItems() {
	return prisma.customer.findMany({
		select: {
			id: true,
			name: true,
			email: true,
		},
	})
}

export async function getCustomerInfo(customerId: string) {
	return prisma.customer.findUnique({
		where: { id: customerId },
		select: { name: true, email: true },
	})
}

export async function getCustomerDetails(customerId: string) {
	const customer = await prisma.customer.findUnique({
		where: { id: customerId },
		select: {
			id: true,
			name: true,
			email: true,
			invoices: {
				select: {
					id: true,
					dueDate: true,
					number: true,
					lineItems: {
						select: {
							quantity: true,
							unitPrice: true,
						},
					},
					deposits: {
						select: { amount: true },
					},
				},
			},
		},
	})
	if (!customer) return null

	const invoiceDetails = customer.invoices.map(invoice => ({
		id: invoice.id,
		number: invoice.number,
		...getInvoiceDerivedData(invoice),
	}))

	return { name: customer.name, email: customer.email, invoiceDetails }
}

export async function createCustomer({
	name,
	email,
}: Pick<Customer, 'name' | 'email'>) {
	return prisma.customer.create({ data: { email, name } })
}
