import mongoose from 'mongoose';
export declare class DashboardService {
    static getStats(): Promise<{
        totalCustomers: number;
        newCustomersThisMonth: number;
        todayDeliveries: number;
        deliveredToday: number;
        pendingToday: number;
        overdueDeliveries: number;
        overdue2Days: number;
        overdue3Plus: number;
        todaySales: any;
        salesGrowth: number;
        monthSales: any;
        monthGrowth: number;
    }>;
    static getSales(period: string, range?: string): Promise<{
        date: any;
        total: any;
        count: any;
    }[]>;
    private static fillDailySales;
    static getDeliveriesOverview(): Promise<{
        total: number;
        todayTotal: number;
        overdueTotal: number;
        breakdown: {
            name: string;
            value: number;
            color: string;
        }[];
    }>;
    static getInventoryOverview(): Promise<{
        slim: {
            inStock: number;
            lowStock: number;
            lowStockWarning: boolean;
            containersOut: number;
            containersReturned: number;
            netContainersOut: number;
        };
        round: {
            inStock: number;
            lowStock: number;
            lowStockWarning: boolean;
            containersOut: number;
            containersReturned: number;
            netContainersOut: number;
        };
        movementsToday: number;
    }>;
    static getRecentDeliveries(limit?: number): Promise<{
        status: import("../utils/deliveryColor").DeliveryStatus;
        colorCode: import("../utils/deliveryColor").DeliveryColorCode;
        referenceNo: string;
        customerId: mongoose.Types.ObjectId;
        date: Date;
        schedule: string;
        remarks?: string;
        discount: number;
        paid: boolean;
        slimOut: number;
        roundOut: number;
        slimIn: number;
        roundIn: number;
        slimReturn: number;
        roundReturn: number;
        rescheduleDate?: Date;
        assignedStaffId?: mongoose.Types.ObjectId;
        continuationDecision?: string;
        inventoryProcessedAt?: Date;
        sourceInvoiceId?: mongoose.Types.ObjectId;
        isDeleted: boolean;
        deletedAt?: Date;
        createdAt: Date;
        updatedAt: Date;
        _id: mongoose.Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: mongoose.Collection;
        db: mongoose.Connection;
        errors?: mongoose.Error.ValidationError;
        isNew: boolean;
        schema: mongoose.Schema;
        __v: number;
    }[]>;
    static getRecentTransactions(limit?: number): Promise<(import("../models/Transaction").ITransaction & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getTopCustomers(limit?: number): Promise<any[]>;
    static getActivityLogs(limit?: number): Promise<(import("../models/Notification").ILog & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getSystemSummary(): Promise<{
        totalUsers: number;
        totalProducts: number;
        totalInventoryItems: number;
        lowStockItems: number;
        movementsToday: number;
        outstandingSlim: any;
        outstandingRound: any;
        databaseConnected: boolean;
        databaseSize: string | null;
        databaseCollections: any;
        lastBackup: Date | null;
        lastBackupFilename: string | null;
        companyName: string;
        version: string;
    }>;
}
//# sourceMappingURL=dashboardService.d.ts.map