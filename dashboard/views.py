from django.http import JsonResponse
import pandas as pd
from django.conf import settings

def get_filters(request):
    try:
        csv_path = settings.BASE_DIR / 'dashboard' / 'data' / 'fmcg_dataset.csv'
        df = pd.read_csv(csv_path)
        
        # Extract unique values for each filter
        filters = {
            'brands': sorted([x for x in df['Brand'].unique().tolist() if pd.notna(x)]),
            'pack_types': sorted([x for x in df['PackType'].unique().tolist() if pd.notna(x)]),
            'ppgs': sorted([x for x in df['PPG'].unique().tolist() if pd.notna(x)]),
            'channels': sorted([x for x in df['Channel'].unique().tolist() if pd.notna(x)]),
            'years': sorted([int(x) for x in df['Year'].unique().tolist() if pd.notna(x)]),
            'months': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }
        
        return JsonResponse(filters)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_chart_data(request):
    try:
        csv_path = settings.BASE_DIR / 'dashboard' / 'data' / 'fmcg_dataset.csv'
        df = pd.read_csv(csv_path)
        
        # Apply filters if provided
        if 'brand' in request.GET:
            brands = request.GET.getlist('brand')
            df = df[df['Brand'].isin(brands)]
        
        if 'pack_type' in request.GET:
            pack_types = request.GET.getlist('pack_type')
            df = df[df['PackType'].isin(pack_types)]
        
        if 'ppg' in request.GET:
            ppgs = request.GET.getlist('ppg')
            df = df[df['PPG'].isin(ppgs)]
        
        if 'channel' in request.GET:
            channels = request.GET.getlist('channel')
            df = df[df['Channel'].isin(channels)]
        
        if 'year' in request.GET:
            years = [int(y) for y in request.GET.getlist('year')]
            df = df[df['Year'].isin(years)]
        
        if 'month' in request.GET:
            months = [int(m) for m in request.GET.getlist('month')]
            df = df[df['Month'].isin(months)]
        
        # Generate chart data
        chart_data = {}
        
        # Sales by Year (Horizontal Bar - totals)
        sales_by_year = df.groupby('Year')['SalesValue'].sum().reset_index()
        sales_by_year.columns = ['Year', 'Sales Value']
        chart_data['sales_by_year'] = sales_by_year.to_dict('records')
        
        # Volume by Year (Horizontal Bar - totals)
        volume_by_year = df.groupby('Year')['Volume'].sum().reset_index()
        volume_by_year.columns = ['Year', 'Volume (kg)']
        chart_data['volume_by_year'] = volume_by_year.to_dict('records')

        # Stacked by Brand (Sales and Volume)
        # Ensure clean brand names and numeric values
        df_brand = df.copy()
        df_brand = df_brand[pd.notna(df_brand['Brand'])]
        df_brand['SalesValue'] = pd.to_numeric(df_brand['SalesValue'], errors='coerce').fillna(0)
        df_brand['Volume'] = pd.to_numeric(df_brand['Volume'], errors='coerce').fillna(0)

        # Choose a stable brand order by total SalesValue desc
        brand_order = (
            df_brand.groupby('Brand')['SalesValue']
            .sum()
            .sort_values(ascending=False)
            .index
            .tolist()
        )
        chart_data['brands_order'] = brand_order

        sales_pivot = (
            df_brand.pivot_table(index='Year', columns='Brand', values='SalesValue', aggfunc='sum', fill_value=0)
            .reset_index()
        )
        # Reorder columns by brand_order
        sales_cols = ['Year'] + [b for b in brand_order if b in sales_pivot.columns]
        sales_pivot = sales_pivot[sales_cols]
        chart_data['sales_by_year_stacked'] = sales_pivot.to_dict('records')

        volume_pivot = (
            df_brand.pivot_table(index='Year', columns='Brand', values='Volume', aggfunc='sum', fill_value=0)
            .reset_index()
        )
        vol_cols = ['Year'] + [b for b in brand_order if b in volume_pivot.columns]
        volume_pivot = volume_pivot[vol_cols]
        chart_data['volume_by_year_stacked'] = volume_pivot.to_dict('records')

        # Totals per Brand - Volume (for dedicated brand chart)
        brand_volume_totals = (
            df_brand.groupby('Brand')['Volume']
            .sum()
            .reindex(brand_order)
            .reset_index()
        )
        brand_volume_totals.columns = ['Brand', 'Volume (kg)']
        chart_data['brand_volume_totals'] = brand_volume_totals.to_dict('records')

        # Month-wise stacked and totals
        month_name = {
            1: '1-Jan', 2: '2-Feb', 3: '3-Mar', 4: '4-Apr', 5: '5-May', 6: '6-Jun',
            7: '7-Jul', 8: '8-Aug', 9: '9-Sep', 10: '10-Oct', 11: '11-Nov', 12: '12-Dec'
        }
        df_brand['Month'] = pd.to_numeric(df_brand['Month'], errors='coerce').astype('Int64')
        df_brand_month = df_brand[df_brand['Month'].notna()].copy()
        if not df_brand_month.empty:
            df_brand_month['MonthLabel'] = df_brand_month['Month'].map(lambda m: month_name.get(int(m), str(int(m))))

            sales_month_pivot = (
                df_brand_month.pivot_table(index='MonthLabel', columns='Brand', values='SalesValue', aggfunc='sum', fill_value=0)
                .reindex([month_name[i] for i in range(1, 13) if month_name.get(i) in set(df_brand_month['MonthLabel'])])
                .reset_index()
            )
            sales_month_cols = ['MonthLabel'] + [b for b in brand_order if b in sales_month_pivot.columns]
            sales_month_pivot = sales_month_pivot[sales_month_cols]
            chart_data['sales_by_month_stacked'] = sales_month_pivot.to_dict('records')

            volume_month_pivot = (
                df_brand_month.pivot_table(index='MonthLabel', columns='Brand', values='Volume', aggfunc='sum', fill_value=0)
                .reindex([month_name[i] for i in range(1, 13) if month_name.get(i) in set(df_brand_month['MonthLabel'])])
                .reset_index()
            )
            volume_month_cols = ['MonthLabel'] + [b for b in brand_order if b in volume_month_pivot.columns]
            volume_month_pivot = volume_month_pivot[volume_month_cols]
            chart_data['volume_by_month_stacked'] = volume_month_pivot.to_dict('records')

            # Totals across brands per month
            sales_by_month_total = (
                df_brand_month.groupby('MonthLabel')['SalesValue'].sum().reindex(sales_month_pivot['MonthLabel'] if 'sales_month_pivot' in locals() else []).reset_index()
            )
            sales_by_month_total.columns = ['Month', 'Sales Value']
            chart_data['sales_by_month'] = sales_by_month_total.to_dict('records')

            volume_by_month_total = (
                df_brand_month.groupby('MonthLabel')['Volume'].sum().reindex(volume_month_pivot['MonthLabel'] if 'volume_month_pivot' in locals() else []).reset_index()
            )
            volume_by_month_total.columns = ['Month', 'Volume (kg)']
            chart_data['volume_by_month'] = volume_by_month_total.to_dict('records')
        
        # Year-wise Sales Value (Vertical Bar)
        chart_data['year_wise_sales'] = sales_by_year.to_dict('records')
        
        # Monthly Sales Trend (Line)
        df['YearMonth'] = df.apply(lambda x: f"{int(x['Year'])}-{int(x['Month']):02d}" if pd.notna(x['Year']) and pd.notna(x['Month']) else None, axis=1)
        monthly_sales = df[df['YearMonth'].notna()].groupby('YearMonth')['SalesValue'].sum().reset_index()
        monthly_sales.columns = ['YearMonth', 'Sales Value']
        chart_data['monthly_sales'] = monthly_sales.to_dict('records')
        
        # Market Share by Sales (Pie)
        market_sales = df.groupby('Market')['SalesValue'].sum().reset_index()
        market_sales.columns = ['name', 'value']
        chart_data['market_share_sales'] = market_sales.to_dict('records')
        
        # Market Share by Volume (Donut)
        market_volume = df.groupby('Market')['Volume'].sum().reset_index()
        market_volume.columns = ['name', 'value']
        chart_data['market_share_volume'] = market_volume.to_dict('records')
        
        return JsonResponse(chart_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
