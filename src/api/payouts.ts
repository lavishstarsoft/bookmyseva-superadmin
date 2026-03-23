import api from "@/lib/axios";

export interface PayoutSummary {
    pendingPayoutAmount: number;
    pendingPayoutCount: number;
    paidPayoutAmount: number;
    paidPayoutCount: number;
    pendingWithdrawalAmount: number;
    pendingWithdrawalCount: number;
    totalCommissionEarned: number;
}

export interface VendorPayoutSummary {
    _id: string;
    name: string;
    email: string;
    phone: string;
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
    };
    pendingAmount: number;
    pendingCount: number;
    paidAmount: number;
    paidCount: number;
    pendingWithdrawalAmount: number;
    pendingWithdrawalCount: number;
    totalEarnings: number;
}

export interface WithdrawalRequest {
    _id: string;
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    vendorPhone: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
    };
    requestedAt: string;
    processedAt?: string;
    processedBy?: string;
    transactionRef?: string;
    remarks?: string;
}

export interface VendorPayout {
    _id: string;
    orderId: string;
    orderAmount: number;
    commissionPercent: number;
    commissionAmount: number;
    vendorAmount: number;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    paidAt?: string;
    transactionRef?: string;
    createdAt: string;
}

export const payoutsApi = {
    // Summary
    getSummary: async () => {
        const res = await api.get<{ status: string; summary: PayoutSummary }>('admin/payouts/summary');
        return res.data;
    },

    // Vendor-wise summary
    getVendorSummaries: async (params?: { search?: string; page?: number; limit?: number }) => {
        const res = await api.get<{
            status: string;
            vendors: VendorPayoutSummary[];
            pagination: { total: number; page: number; limit: number; pages: number };
        }>('admin/payouts/vendors', { params });
        return res.data;
    },

    // Withdrawal requests
    getWithdrawalRequests: async (params?: { status?: string; page?: number; limit?: number }) => {
        const res = await api.get<{
            status: string;
            requests: WithdrawalRequest[];
            stats: { pending: number; approved: number; paid: number; rejected: number };
            pagination: { total: number; page: number; limit: number; pages: number };
        }>('admin/payouts/withdrawals', { params });
        return res.data;
    },

    // Approve withdrawal
    approveWithdrawal: async (id: string, remarks?: string) => {
        const res = await api.patch(`admin/payouts/withdrawals/${id}/approve`, { remarks });
        return res.data;
    },

    // Reject withdrawal
    rejectWithdrawal: async (id: string, remarks: string) => {
        const res = await api.patch(`admin/payouts/withdrawals/${id}/reject`, { remarks });
        return res.data;
    },

    // Mark withdrawal as paid
    markWithdrawalPaid: async (id: string, transactionRef: string, remarks?: string) => {
        const res = await api.patch(`admin/payouts/withdrawals/${id}/pay`, { transactionRef, remarks });
        return res.data;
    },

    // Get vendor payouts
    getVendorPayouts: async (vendorId: string, params?: { status?: string; page?: number; limit?: number }) => {
        const res = await api.get<{
            status: string;
            vendor: { _id: string; name: string; email: string; phone: string; bankDetails: any };
            summary: { pendingAmount: number; paidAmount: number; totalEarnings: number };
            payouts: VendorPayout[];
            pagination: { total: number; page: number; limit: number; pages: number };
        }>(`admin/payouts/vendor/${vendorId}`, { params });
        return res.data;
    },

    // Pay all vendor payouts
    payAllVendorPayouts: async (vendorId: string, transactionRef: string) => {
        const res = await api.post(`admin/payouts/vendor/${vendorId}/pay-all`, { transactionRef });
        return res.data;
    },

    // Mark single payout as paid
    markPayoutPaid: async (payoutId: string, transactionRef: string) => {
        const res = await api.patch(`admin/payouts/${payoutId}/pay`, { transactionRef });
        return res.data;
    }
};
