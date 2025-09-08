from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Portfolio, Stock, InterestedStock
from .serializers import (
    PortfolioSerializer, PortfolioCreateSerializer,
    StockSerializer, StockCreateSerializer,
    InterestedStockSerializer
)
from rest_framework import filters


class PortfolioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PortfolioSerializer

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PortfolioCreateSerializer
        return PortfolioSerializer

    @action(detail=True, methods=['get'])
    def stocks(self, request, pk=None):
        portfolio = self.get_object()
        stocks = portfolio.stocks.all()
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        portfolio = self.get_object()
        serializer = StockCreateSerializer(
            data=request.data,
            context={'portfolio_id': portfolio.id}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = StockSerializer

    def get_queryset(self):
        return Stock.objects.filter(portfolio__user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return StockCreateSerializer
        return StockSerializer

    def create(self, request, *args, **kwargs):
        portfolio_id = request.data.get('portfolio_id')
        if not portfolio_id:
            return Response(
                {'error': 'portfolio_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        portfolio = get_object_or_404(Portfolio, id=portfolio_id, user=request.user)
        serializer = self.get_serializer(
            data=request.data,
            context={'portfolio_id': portfolio.id}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InterestedStockViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InterestedStockSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['symbol', 'name']

    def get_queryset(self):
        return InterestedStock.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        query = request.query_params.get('search', '')
        qs = self.get_queryset().filter(symbol__icontains=query)[:10]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
