"""
Admin utilities for Swiss VFG waitlist workflow
CLI tasks for managing product approvals and status changes
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import argparse
import asyncio
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
try:
    from tabulate import tabulate
except ImportError:
    # Fallback if tabulate is not installed
    def tabulate(data, headers='keys', tablefmt='grid'):
        if not data:
            return "No data"
        
        if headers == 'keys' and isinstance(data[0], dict):
            headers = list(data[0].keys())
        
        # Simple text table fallback
        result = []
        if headers:
            result.append(' | '.join(str(h) for h in headers))
            result.append('-' * len(result[0]))
        
        for row in data:
            if isinstance(row, dict):
                result.append(' | '.join(str(row.get(h, '')) for h in headers))
            else:
                result.append(' | '.join(str(cell) for cell in row))
        
        return '\n'.join(result)

from database.supabase_client import SupabaseClient
from models.waitlist import WaitlistUpdate, WaitlistReason
from models.product import ProductStatus


class AdminUtilities:
    """Admin utility functions for waitlist management"""
    
    def __init__(self):
        self.db_client = SupabaseClient()
        self.db_client.connect()
    
    def list_waitlist_entries(self, status_filter: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List waitlist entries with optional filtering
        
        Args:
            status_filter: 'new', 'update', 'manual_review' or None for all
            limit: Maximum number of entries to return
        """
        entries = self.db_client.get_waitlist_entries(status_filter, limit)
        
        # Format for display
        formatted = []
        for entry in entries:
            formatted.append({
                'ID': entry['id'],  # Full ID
                'Slug': entry['product_slug'],
                'Type': 'NEW' if not entry['product_id'] else 'UPDATE',
                'Reason': entry['reason'],
                'Manual Review': '⚠️' if entry.get('requires_manual_review') else '',
                'Invalid Discount': '❌' if entry.get('has_invalid_discount') else '',
                'Price Drop %': f"{entry.get('price_drop_percentage', 0):.1f}" if entry.get('price_drop_percentage') else '',
                'Version': entry.get('version', 1),
                'Created': entry['created_at'][:16] if isinstance(entry['created_at'], str) else str(entry['created_at'])[:16]
            })
        
        return formatted
    
    def get_waitlist_diff(self, waitlist_id: str) -> Dict[str, Any]:
        """
        Get diff payload for a pending update
        
        Args:
            waitlist_id: Waitlist entry ID
        """
        entries = self.db_client.get_waitlist_entries()
        
        for entry in entries:
            if entry['id'] == waitlist_id:
                waitlist = WaitlistUpdate.from_supabase_dict(entry)
                
                # Get existing product if it's an update
                if waitlist.product_id:
                    existing = self.db_client.supabase.table('products')\
                        .select('*')\
                        .eq('id', waitlist.product_id)\
                        .execute()
                    
                    if existing.data:
                        diff = waitlist.calculate_diff(existing.data[0])
                        return {
                            'waitlist_id': waitlist_id,
                            'product_slug': waitlist.product_slug,
                            'diff': diff,
                            'validation': {
                                'has_invalid_discount': waitlist.has_invalid_discount,
                                'price_drop_percentage': waitlist.price_drop_percentage,
                                'requires_manual_review': waitlist.requires_manual_review
                            }
                        }
                else:
                    # New product
                    return {
                        'waitlist_id': waitlist_id,
                        'product_slug': waitlist.product_slug,
                        'new_product': waitlist.payload_json,
                        'validation': {
                            'has_invalid_discount': waitlist.has_invalid_discount,
                            'requires_manual_review': waitlist.requires_manual_review
                        }
                    }
        
        return {'error': f'Waitlist entry not found: {waitlist_id}'}
    
    async def approve_entry(self, waitlist_id: str, actor: str = "admin") -> bool:
        """
        Approve a waitlist entry
        
        Args:
            waitlist_id: Waitlist entry ID
            actor: Who is approving (for audit log)
        """
        success = await self.db_client.approve_waitlist_entry(waitlist_id, actor)
        
        if success:
            print(f"✅ Approved waitlist entry: {waitlist_id}")
        else:
            print(f"❌ Failed to approve waitlist entry: {waitlist_id}")
        
        return success
    
    async def reject_entry(self, waitlist_id: str, actor: str = "admin", reason: str = None) -> bool:
        """
        Reject a waitlist entry
        
        Args:
            waitlist_id: Waitlist entry ID
            actor: Who is rejecting (for audit log)
            reason: Rejection reason
        """
        success = await self.db_client.reject_waitlist_entry(waitlist_id, actor, reason)
        
        if success:
            print(f"❌ Rejected waitlist entry: {waitlist_id}")
        else:
            print(f"⚠️ Failed to reject waitlist entry: {waitlist_id}")
        
        return success
    
    async def bulk_approve(self, waitlist_ids: List[str], actor: str = "admin") -> Dict[str, int]:
        """
        Bulk approve multiple waitlist entries
        
        Args:
            waitlist_ids: List of waitlist entry IDs
            actor: Who is approving
        """
        results = {'approved': 0, 'failed': 0}
        
        for waitlist_id in waitlist_ids:
            success = await self.approve_entry(waitlist_id, actor)
            if success:
                results['approved'] += 1
            else:
                results['failed'] += 1
        
        return results
    
    async def bulk_reject(self, waitlist_ids: List[str], actor: str = "admin", reason: str = None) -> Dict[str, int]:
        """
        Bulk reject multiple waitlist entries
        
        Args:
            waitlist_ids: List of waitlist entry IDs
            actor: Who is rejecting
            reason: Rejection reason
        """
        results = {'rejected': 0, 'failed': 0}
        
        for waitlist_id in waitlist_ids:
            success = await self.reject_entry(waitlist_id, actor, reason)
            if success:
                results['rejected'] += 1
            else:
                results['failed'] += 1
        
        return results
    
    def update_product_status(self, product_id: str, new_status: ProductStatus) -> bool:
        """
        Update product status
        
        Args:
            product_id: Product UUID
            new_status: New status to set
        """
        try:
            result = self.db_client.supabase.table('products')\
                .update({'status': new_status.value})\
                .eq('id', product_id)\
                .execute()
            
            if result.data:
                print(f"✅ Updated product {product_id} status to {new_status.value}")
                return True
            else:
                print(f"❌ Failed to update product status")
                return False
                
        except Exception as e:
            print(f"❌ Error updating product status: {str(e)}")
            return False
    
    def set_product_changeability(self, product_slug: str, is_changeable: bool) -> bool:
        """
        Set product changeability flag
        
        Args:
            product_slug: Product slug
            is_changeable: Whether product can be updated by scraper
        """
        try:
            result = self.db_client.supabase.table('products')\
                .update({'is_changeable': is_changeable})\
                .eq('slug', product_slug)\
                .execute()
            
            if result.data:
                status = "changeable" if is_changeable else "non-changeable"
                print(f"✅ Set product {product_slug} as {status}")
                return True
            else:
                print(f"❌ Failed to update product changeability")
                return False
                
        except Exception as e:
            print(f"❌ Error updating product changeability: {str(e)}")
            return False
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get comprehensive queue statistics"""
        try:
            # Get all waitlist entries
            all_entries = self.db_client.get_waitlist_entries(limit=1000)
            
            # Calculate stats
            stats = {
                'total_entries': len(all_entries),
                'new_products': sum(1 for e in all_entries if not e.get('product_id')),
                'pending_updates': sum(1 for e in all_entries if e.get('product_id')),
                'manual_review_required': sum(1 for e in all_entries if e.get('requires_manual_review')),
                'invalid_discounts': sum(1 for e in all_entries if e.get('has_invalid_discount')),
                'average_version': sum(e.get('version', 1) for e in all_entries) / len(all_entries) if all_entries else 0,
                'reasons': {}
            }
            
            # Count by reason
            for entry in all_entries:
                reason = entry.get('reason', 'unknown')
                stats['reasons'][reason] = stats['reasons'].get(reason, 0) + 1
            
            return stats
            
        except Exception as e:
            return {'error': str(e)}


def main():
    """CLI interface for admin utilities"""
    parser = argparse.ArgumentParser(description='Admin utilities for Swiss VFG waitlist management')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List waitlist entries')
    list_parser.add_argument('--filter', choices=['new', 'update', 'manual_review'], help='Filter entries')
    list_parser.add_argument('--limit', type=int, default=50, help='Maximum entries to show')
    
    # Diff command
    diff_parser = subparsers.add_parser('diff', help='Show diff for a waitlist entry')
    diff_parser.add_argument('waitlist_id', help='Waitlist entry ID')
    
    # Approve command
    approve_parser = subparsers.add_parser('approve', help='Approve waitlist entry')
    approve_parser.add_argument('waitlist_ids', nargs='+', help='Waitlist entry ID(s)')
    approve_parser.add_argument('--actor', default='admin', help='Who is approving')
    
    # Reject command
    reject_parser = subparsers.add_parser('reject', help='Reject waitlist entry')
    reject_parser.add_argument('waitlist_ids', nargs='+', help='Waitlist entry ID(s)')
    reject_parser.add_argument('--actor', default='admin', help='Who is rejecting')
    reject_parser.add_argument('--reason', help='Rejection reason')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Update product status')
    status_parser.add_argument('product_id', help='Product UUID')
    status_parser.add_argument('new_status', choices=['active', 'passive', 'waiting_approval', 'rejected', 'pending_update'])
    
    # Changeability command
    change_parser = subparsers.add_parser('changeable', help='Set product changeability')
    change_parser.add_argument('product_slug', help='Product slug')
    change_parser.add_argument('--set', choices=['true', 'false'], required=True, help='Set changeability')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show queue statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    admin = AdminUtilities()
    
    if args.command == 'list':
        entries = admin.list_waitlist_entries(args.filter, args.limit)
        if entries:
            print(tabulate(entries, headers='keys', tablefmt='grid'))
        else:
            print("No waitlist entries found")
    
    elif args.command == 'diff':
        diff = admin.get_waitlist_diff(args.waitlist_id)
        print(json.dumps(diff, indent=2, default=str))
    
    elif args.command == 'approve':
        if len(args.waitlist_ids) == 1:
            asyncio.run(admin.approve_entry(args.waitlist_ids[0], args.actor))
        else:
            results = asyncio.run(admin.bulk_approve(args.waitlist_ids, args.actor))
            print(f"Bulk approval complete: {results}")
    
    elif args.command == 'reject':
        if len(args.waitlist_ids) == 1:
            asyncio.run(admin.reject_entry(args.waitlist_ids[0], args.actor, args.reason))
        else:
            results = asyncio.run(admin.bulk_reject(args.waitlist_ids, args.actor, args.reason))
            print(f"Bulk rejection complete: {results}")
    
    elif args.command == 'status':
        status = ProductStatus(args.new_status)
        admin.update_product_status(args.product_id, status)
    
    elif args.command == 'changeable':
        is_changeable = args.set == 'true'
        admin.set_product_changeability(args.product_slug, is_changeable)
    
    elif args.command == 'stats':
        stats = admin.get_queue_stats()
        print("\n📊 Waitlist Queue Statistics:")
        print("=" * 40)
        for key, value in stats.items():
            if key != 'reasons':
                print(f"{key}: {value}")
        
        if 'reasons' in stats and stats['reasons']:
            print("\n📋 Entries by Reason:")
            for reason, count in stats['reasons'].items():
                print(f"  - {reason}: {count}")


if __name__ == "__main__":
    main()