from django.shortcuts import render
from django.http import JsonResponse
import pandas as pd
import os
from django.conf import settings

# Create your views here.

def get_filters(request):
    """Return available filter options for the dashboard"""
    try:
        # Load the dataset
        csv_path = os.path.join(settings.BASE_DIR, 'dashboard', 'data', 'fmcg_dataset.csv')
        df = pd.read_csv(csv_path)
        
        # Extract unique values for each filter
        filters = {
            'brands': sorted(df['Brand'].unique().tolist()),
            'pack_types': sorted(df['PackType'].unique().tolist()),
            'ppgs': sorted(df['PPG'].unique().tolist()),
            'channels': sorted(df['Channel'].unique().tolist()),
            'years': sorted(df['Year'].unique().tolist())
        }
        
        return JsonResponse(filters)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_chart_data(request):
    """Return chart data based on selected filters"""
    try:
        # Load the dataset
        csv_path = os.path.join(settings.BASE_DIR, 'dashboard', 'data', 'fmcg_dataset.csv')
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
        
        # Generate chart data
        chart_data = {}
        
        # Sales by Year (Horizontal Bar)
        sales_by_year = df.groupby('Year')['SalesValue'].sum().reset_index()
        sales_by_year.columns = ['Year', 'Sales Value']
        chart_data['sales_by_year'] = sales_by_year.to_dict('records')
        
        # Volume by Year (Horizontal Bar)
        volume_by_year = df.groupby('Year')['Volume'].sum().reset_index()
        volume_by_year.columns = ['Year', 'Volume (kg)']
        chart_data['volume_by_year'] = volume_by_year.to_dict('records')
        
        # Year-wise Sales Value (Vertical Bar)
        chart_data['year_wise_sales'] = sales_by_year.to_dict('records')
        
        # Monthly Sales Trend (Line)
        df['YearMonth'] = df['Year'].astype(str) + '-' + df['Month'].astype(str).str.zfill(2)
        monthly_sales = df.groupby('YearMonth')['SalesValue'].sum().reset_index()
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
