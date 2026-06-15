import CourierPartner from '../models/CourierPartner';
import Shipment from '../models/Shipment';

interface CourierOption {
  courier: any;
  score: number;
  estimatedCost: number;
  estimatedDays: number;
  reasons: string[];
}

interface RoutingCriteria {
  destinationPincode: string;
  weight: number;
  isCOD: boolean;
  orderValue: number;
  priority: 'cost' | 'speed' | 'balance';
}

class CourierRoutingEngine {
  private static instance: CourierRoutingEngine;

  public static getInstance(): CourierRoutingEngine {
    if (!CourierRoutingEngine.instance) {
      CourierRoutingEngine.instance = new CourierRoutingEngine();
    }
    return CourierRoutingEngine.instance;
  }

  /**
   * Find the best courier for a shipment based on routing criteria
   */
  async findBestCourier(criteria: RoutingCriteria): Promise<CourierOption | null> {
    try {
      // Get all active courier partners
      const couriers = await CourierPartner.find({ isActive: true });

      if (couriers.length === 0) {
        return null;
      }

      const options: CourierOption[] = [];

      for (const courier of couriers) {
        const option = await this.evaluateCourier(courier, criteria);
        if (option) {
          options.push(option);
        }
      }

      if (options.length === 0) {
        return null;
      }

      // Sort by score (higher is better)
      options.sort((a, b) => b.score - a.score);

      return options[0];
    } catch (error) {
      console.error('Error finding best courier:', error);
      return null;
    }
  }

  /**
   * Evaluate a courier based on routing criteria
   */
  private async evaluateCourier(courier: any, criteria: RoutingCriteria): Promise<CourierOption | null> {
    let score = 0;
    const reasons: string[] = [];
    let estimatedCost = 0;
    const estimatedDays = courier.averageDeliveryDays;

    // Check if courier supports the destination pincode
    if (courier.serviceablePincodes && courier.serviceablePincodes.length > 0) {
      if (!courier.serviceablePincodes.includes(criteria.destinationPincode)) {
        return null; // Courier doesn't service this pincode
      }
    }

    // Check weight limits
    if (criteria.weight > courier.maxWeightKg || criteria.weight < courier.minWeightKg) {
      return null; // Weight not supported
    }

    // Check COD support
    if (criteria.isCOD && !courier.supportsCOD) {
      return null; // COD not supported
    }

    // Calculate cost
    estimatedCost = this.calculateShippingCost(courier, criteria);

    // Base score from success rate (0-40 points)
    const successScore = (courier.successRate / 100) * 40;
    score += successScore;
    reasons.push(`Success rate: ${courier.successRate}% (+${successScore.toFixed(1)})`);

    // Cost factor (0-30 points, lower cost = higher score)
    const avgCost = 150; // Assume average cost for normalization
    const costScore = Math.max(0, 30 - (estimatedCost / avgCost) * 30);
    score += costScore;
    reasons.push(`Cost: ₹${estimatedCost} (+${costScore.toFixed(1)})`);

    // Speed factor (0-20 points, faster = higher score)
    const speedScore = Math.max(0, 20 - (estimatedDays - 1) * 2);
    score += speedScore;
    reasons.push(`Speed: ${estimatedDays} days (+${speedScore.toFixed(1)})`);

    // RTO rate penalty (0-10 points deduction)
    const rtoPenalty = (courier.rtoRate / 100) * 10;
    score -= rtoPenalty;
    reasons.push(`RTO rate: ${courier.rtoRate}% (-${rtoPenalty.toFixed(1)})`);

    // Priority adjustments
    if (criteria.priority === 'cost') {
      score += costScore * 0.5; // Boost cost factor
      reasons.push('Cost priority bonus (+' + (costScore * 0.5).toFixed(1) + ')');
    } else if (criteria.priority === 'speed') {
      score += speedScore * 0.5; // Boost speed factor
      reasons.push('Speed priority bonus (+' + (speedScore * 0.5).toFixed(1) + ')');
    }

    // COD bonus if applicable
    if (criteria.isCOD) {
      score += 5;
      reasons.push('COD supported (+5)');
    }

    return {
      courier,
      score: Math.max(0, score),
      estimatedCost,
      estimatedDays,
      reasons
    };
  }

  /**
   * Calculate shipping cost for a courier
   */
  private calculateShippingCost(courier: any, criteria: RoutingCriteria): number {
    let cost = courier.baseRate * criteria.weight;

    // Additional rate for heavy items
    if (criteria.weight > 5) {
      cost += courier.additionalRate * (criteria.weight - 5);
    }

    // COD charges
    if (criteria.isCOD) {
      cost += (criteria.orderValue * courier.codChargePercent) / 100;
    }

    // Fuel surcharge
    cost += (cost * courier.fuelSurchargePercent) / 100;

    // Zone-based pricing
    const zone = this.getZoneFromPincode(criteria.destinationPincode);
    if (courier.zonePricing && courier.zonePricing.get(zone)) {
      const zonePricing = courier.zonePricing.get(zone);
      cost = zonePricing.baseRate * criteria.weight;
      if (criteria.weight > 5) {
        cost += zonePricing.additionalRate * (criteria.weight - 5);
      }
    }

    return Math.round(cost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get zone from pincode (simplified logic)
   */
  private getZoneFromPincode(pincode: string): string {
    // This is a simplified zone determination
    // In production, you'd use a proper pincode database
    const pin = parseInt(pincode.substring(0, 3));

    if (pin >= 110 && pin <= 199) return 'Delhi';
    if (pin >= 400 && pin <= 499) return 'Mumbai';
    if (pin >= 560 && pin <= 599) return 'Bangalore';
    if (pin >= 600 && pin <= 699) return 'Chennai';
    if (pin >= 700 && pin <= 799) return 'Kolkata';

    return 'Other';
  }

  /**
   * Get all available couriers for a destination
   */
  async getAvailableCouriers(destinationPincode: string, weight: number, isCOD: boolean): Promise<any[]> {
    try {
      const couriers = await CourierPartner.find({
        isActive: true,
        maxWeightKg: { $gte: weight },
        minWeightKg: { $lte: weight },
        ...(isCOD ? { supportsCOD: true } : {}),
        ...(destinationPincode ? { serviceablePincodes: destinationPincode } : {})
      });

      return couriers;
    } catch (error) {
      console.error('Error getting available couriers:', error);
      return [];
    }
  }

  /**
   * Get courier performance metrics
   */
  async getCourierMetrics(courierId: string): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const shipments = await Shipment.find({
        courierPartner: courierId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      const totalShipments = shipments.length;
      const delivered = shipments.filter(s => s.status === 'Delivered').length;
      const returned = shipments.filter(s => s.status === 'Returned').length;

      return {
        totalShipments,
        successRate: totalShipments > 0 ? (delivered / totalShipments) * 100 : 0,
        rtoRate: totalShipments > 0 ? (returned / totalShipments) * 100 : 0,
        averageDeliveryDays: this.calculateAverageDeliveryTime(shipments)
      };
    } catch (error) {
      console.error('Error getting courier metrics:', error);
      return null;
    }
  }

  private calculateAverageDeliveryTime(shipments: any[]): number {
    const deliveredShipments = shipments.filter(s =>
      s.status === 'Delivered' && s.actualDeliveryDate && s.createdAt
    );

    if (deliveredShipments.length === 0) return 3; // Default

    const totalDays = deliveredShipments.reduce((sum, shipment) => {
      const deliveryTime = new Date(shipment.actualDeliveryDate).getTime() - new Date(shipment.createdAt).getTime();
      return sum + (deliveryTime / (1000 * 60 * 60 * 24));
    }, 0);

    return Math.round((totalDays / deliveredShipments.length) * 10) / 10;
  }
}

export default CourierRoutingEngine;