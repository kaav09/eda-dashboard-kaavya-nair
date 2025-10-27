from django.urls import path
from . import views

urlpatterns = [
    path('filters/', views.get_filters, name='get_filters'),
    path('chart-data/', views.get_chart_data, name='get_chart_data'),
]

