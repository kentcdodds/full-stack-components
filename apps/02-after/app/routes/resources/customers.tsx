import type { LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { useId, useState } from 'react'
import { useSpinDelay } from 'spin-delay'
import invariant from 'tiny-invariant'
import { LabelText } from '~/components'
import { searchCustomers } from '~/models/customer.server'
import { requireUser } from '~/session.server'

export async function loader({ request }: LoaderArgs) {
	await requireUser(request)
	const url = new URL(request.url)
	const query = url.searchParams.get('query')
	invariant(typeof query === 'string', 'query is required')
	return json({
		customers: await searchCustomers(query),
	})
}

export function CustomerCombobox({ error }: { error?: string | null }) {
	const customerFetcher = useFetcher<typeof loader>()
	const id = useId()
	const customers = customerFetcher.data?.customers ?? []
	type Customer = typeof customers[number]
	const [selectedCustomer, setSelectedCustomer] = useState<
		Customer | null | undefined
	>(null)

	const cb = useCombobox<Customer>({
		id,
		onSelectedItemChange: ({ selectedItem }) => {
			setSelectedCustomer(selectedItem)
		},
		items: customers,
		itemToString: item => (item ? item.name : ''),
		onInputValueChange: changes => {
			customerFetcher.submit(
				{ query: changes.inputValue ?? '' },
				{ method: 'get', action: '/resources/customers' },
			)
		},
	})

	const busy = customerFetcher.state !== 'idle'
	const showSpinner = useSpinDelay(busy, {
		delay: 150,
		minDuration: 300,
	})
	const displayMenu = cb.isOpen && customers.length > 0

	return (
		<div className="relative">
			<input
				name="customerId"
				type="hidden"
				value={selectedCustomer?.id ?? ''}
			/>
			<div className="flex flex-wrap items-center gap-1">
				<label {...cb.getLabelProps()}>
					<LabelText>Customer</LabelText>
				</label>
				{error ? (
					<em id="customer-error" className="text-d-p-xs text-red-600">
						{error}
					</em>
				) : null}
			</div>
			<div {...cb.getComboboxProps({ className: 'relative' })}>
				<input
					{...cb.getInputProps({
						className: clsx('text-lg w-full border border-gray-500 px-2 py-1', {
							'rounded-t rounded-b-0': displayMenu,
							rounded: !displayMenu,
						}),
						'aria-invalid': Boolean(error) || undefined,
						'aria-errormessage': error ? 'customer-error' : undefined,
					})}
				/>
				<Spinner showSpinner={showSpinner} />
			</div>
			<ul
				{...cb.getMenuProps({
					className: clsx(
						'absolute z-10 bg-white shadow-lg rounded-b w-full border border-t-0 border-gray-500 max-h-[180px] overflow-scroll',
						{ hidden: !displayMenu },
					),
				})}
			>
				{displayMenu
					? customers.map((customer, index) => (
							<li
								className={clsx('cursor-pointer py-1 px-2', {
									'bg-green-200': cb.highlightedIndex === index,
								})}
								key={customer.id}
								{...cb.getItemProps({ item: customer, index })}
							>
								{customer.name} ({customer.email})
							</li>
					  ))
					: null}
			</ul>
		</div>
	)
}

function Spinner({ showSpinner }: { showSpinner: boolean }) {
	return (
		<div
			className={`absolute right-0 top-[6px] transition-opacity ${
				showSpinner ? 'opacity-100' : 'opacity-0'
			}`}
		>
			<svg
				className="-ml-1 mr-3 h-5 w-5 animate-spin"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				width="1em"
				height="1em"
			>
				<circle
					className="opacity-25"
					cx={12}
					cy={12}
					r={10}
					stroke="currentColor"
					strokeWidth={4}
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
		</div>
	)
}
